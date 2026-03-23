-- Migration: 006_conversations_messages
-- conversations + messages tables, trigger, RLS, and Realtime publication.

-- ── Conversations ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  participant_2   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  -- Canonical ordering prevents (A,B) and (B,A) duplicates
  CHECK (participant_1 < participant_2)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_participants
  ON conversations (participant_1, participant_2);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message
  ON conversations (last_message_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Only participants can see or create their own conversations
CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Participants can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- ── Messages ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content         TEXT NOT NULL CHECK (char_length(content) <= 2000),
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_time
  ON messages (conversation_id, created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- CRITICAL: all message policies gate on conversation participation
CREATE POLICY "Participants can read messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Participants can mark messages read"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  )
  WITH CHECK (
    -- Can only update is_read, never change sender/content/conversation
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- ── Trigger: keep last_message_at fresh ───────────────────────────────
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- ── Realtime ──────────────────────────────────────────────────────────
-- REPLICA IDENTITY FULL is required for UPDATE/DELETE events in Realtime.
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Add messages table to the Supabase Realtime publication.
-- (Run in the Supabase SQL editor; idempotent on repeated migrations.)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ── get_conversation_list RPC ─────────────────────────────────────────
-- Returns all conversations for a user with last message and unread count
-- in a single query, using DISTINCT ON for the last message per conversation.
CREATE OR REPLACE FUNCTION get_conversation_list(p_user_id UUID)
RETURNS TABLE (
  conversation_id       UUID,
  other_user_id         UUID,
  other_display_name    TEXT,
  other_avatar_url      TEXT,
  last_message_content  TEXT,
  last_message_at       TIMESTAMPTZ,
  last_message_sender_id UUID,
  unread_count          BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH conv AS (
    SELECT
      c.id,
      CASE
        WHEN c.participant_1 = p_user_id THEN c.participant_2
        ELSE c.participant_1
      END AS other_id,
      c.last_message_at
    FROM conversations c
    WHERE c.participant_1 = p_user_id OR c.participant_2 = p_user_id
  ),
  last_msg AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id,
      m.content,
      m.sender_id,
      m.created_at
    FROM messages m
    WHERE m.conversation_id IN (SELECT id FROM conv)
    ORDER BY m.conversation_id, m.created_at DESC
  ),
  unread AS (
    SELECT m.conversation_id, COUNT(*)::BIGINT AS cnt
    FROM messages m
    WHERE m.conversation_id IN (SELECT id FROM conv)
      AND m.sender_id  != p_user_id
      AND m.is_read     = false
    GROUP BY m.conversation_id
  )
  SELECT
    conv.id            AS conversation_id,
    conv.other_id      AS other_user_id,
    p.display_name     AS other_display_name,
    p.avatar_url       AS other_avatar_url,
    lm.content         AS last_message_content,
    conv.last_message_at,
    lm.sender_id       AS last_message_sender_id,
    COALESCE(u.cnt, 0) AS unread_count
  FROM conv
  JOIN profiles p   ON p.id  = conv.other_id
  LEFT JOIN last_msg lm ON lm.conversation_id = conv.id
  LEFT JOIN unread   u  ON u.conversation_id  = conv.id
  ORDER BY conv.last_message_at DESC NULLS LAST;
$$;
