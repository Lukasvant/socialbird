-- Migration: 005_follows
-- Follows table, RLS, indexes, and the discover_users RPC for PostGIS-based discovery

-- ── Follows table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  follower_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY  (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id  ON follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows (following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT USING (true);

CREATE POLICY "Users can follow"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id AND follower_id != following_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ── discover_users RPC ────────────────────────────────────────────────
-- Returns nearby onboarded users with follower counts and follow status.
-- Sort: 'nearest' | 'followers' | 'recent'
-- p_interests NULL → no interest filter.
CREATE OR REPLACE FUNCTION discover_users(
  p_current_user_id UUID,
  p_lat             FLOAT8,
  p_lng             FLOAT8,
  p_radius_meters   FLOAT8  DEFAULT 100000,
  p_interests       TEXT[]  DEFAULT NULL,
  p_sort            TEXT    DEFAULT 'nearest',
  p_limit           INT     DEFAULT 20
)
RETURNS TABLE (
  id              UUID,
  display_name    TEXT,
  bio             TEXT,
  avatar_url      TEXT,
  location_name   TEXT,
  interests       TEXT[],
  follower_count  BIGINT,
  distance_meters FLOAT8,
  is_following    BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    p.id,
    p.display_name,
    p.bio,
    p.avatar_url,
    p.location_name,
    p.interests,
    COUNT(DISTINCT f_in.follower_id)::BIGINT                          AS follower_count,
    ST_Distance(
      p.location_point,
      ST_MakePoint(p_lng, p_lat)::geography
    )                                                                 AS distance_meters,
    EXISTS (
      SELECT 1 FROM follows
      WHERE follower_id  = p_current_user_id
        AND following_id = p.id
    )                                                                 AS is_following
  FROM profiles p
  LEFT JOIN follows f_in ON f_in.following_id = p.id
  WHERE
    p.id            != p_current_user_id
    AND p.is_onboarded  = true
    AND p.location_point IS NOT NULL
    AND ST_DWithin(
      p.location_point,
      ST_MakePoint(p_lng, p_lat)::geography,
      p_radius_meters
    )
    AND (
      p_interests IS NULL
      OR array_length(p_interests, 1) IS NULL
      OR p.interests && p_interests
    )
  GROUP BY p.id
  ORDER BY
    -- Only one CASE is non-NULL at a time; NULLS LAST keeps inactive sort keys from
    -- affecting the result.  ASC throughout; DESC values are negated.
    CASE WHEN p_sort = 'nearest'
      THEN ST_Distance(p.location_point, ST_MakePoint(p_lng, p_lat)::geography)
    END ASC NULLS LAST,
    CASE WHEN p_sort = 'followers'
      THEN -(COUNT(DISTINCT f_in.follower_id))::FLOAT8
    END ASC NULLS LAST,
    CASE WHEN p_sort = 'recent'
      THEN -EXTRACT(EPOCH FROM p.created_at)
    END ASC NULLS LAST,
    p.created_at DESC
  LIMIT p_limit;
$$;

-- ── Profile follower/following counts helper ─────────────────────────
-- A tiny helper called from the API to get counts for a single profile.
CREATE OR REPLACE FUNCTION profile_follow_counts(p_profile_id UUID)
RETURNS TABLE (follower_count BIGINT, following_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    (SELECT COUNT(*) FROM follows WHERE following_id = p_profile_id)::BIGINT,
    (SELECT COUNT(*) FROM follows WHERE follower_id  = p_profile_id)::BIGINT;
$$;
