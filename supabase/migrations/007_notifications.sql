-- ──────────────────────────────────────────────────────────────
-- 007 · Notifications
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type            TEXT        NOT NULL CHECK (type IN ('new_follower', 'post_liked', 'new_message')),
  actor_id        UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  post_id         UUID        REFERENCES posts(id)    ON DELETE CASCADE,
  conversation_id UUID        REFERENCES conversations(id) ON DELETE CASCADE,
  is_read         BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read, created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Triggers use SECURITY DEFINER so they bypass RLS on INSERT.
-- The UPDATE policy lets the app mark notifications as read.
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Trigger: new_follower ─────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, actor_id)
  VALUES (NEW.following_id, 'new_follower', NEW.follower_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_follower ON follows;
CREATE TRIGGER trg_notify_new_follower
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_new_follower();

-- ── Trigger: post_liked ──────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_post_liked()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_post_owner UUID;
BEGIN
  SELECT user_id INTO v_post_owner FROM posts WHERE id = NEW.post_id;
  -- Don't notify when liking your own post
  IF v_post_owner IS NOT NULL AND v_post_owner <> NEW.user_id THEN
    INSERT INTO notifications (user_id, type, actor_id, post_id)
    VALUES (v_post_owner, 'post_liked', NEW.user_id, NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_post_liked ON likes;
CREATE TRIGGER trg_notify_post_liked
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_post_liked();

-- ── Trigger: new_message ─────────────────────────────────────
-- Deduplicates: replaces any existing unread notification for
-- the same conversation so there is at most one per conversation.

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_recipient UUID;
BEGIN
  SELECT
    CASE WHEN c.participant_1 = NEW.sender_id
         THEN c.participant_2
         ELSE c.participant_1
    END
  INTO v_recipient
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  IF v_recipient IS NOT NULL THEN
    -- Remove stale unread notification for this conversation
    DELETE FROM notifications
    WHERE user_id         = v_recipient
      AND type            = 'new_message'
      AND conversation_id = NEW.conversation_id
      AND is_read         = false;

    INSERT INTO notifications (user_id, type, actor_id, conversation_id)
    VALUES (v_recipient, 'new_message', NEW.sender_id, NEW.conversation_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON messages;
CREATE TRIGGER trg_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- ── Realtime ─────────────────────────────────────────────────

ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
