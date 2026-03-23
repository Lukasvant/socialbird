-- Migration: 004_posts_likes
-- Posts table + likes table with indexes and RLS

-- ── Posts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_url     TEXT NOT NULL,
  caption       TEXT CHECK (char_length(caption) <= 500),
  sighting_location_name  TEXT,
  sighting_location_point GEOGRAPHY(POINT, 4326),
  species_tags  TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id      ON posts (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at    ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_location      ON posts USING GIST (sighting_location_point);
CREATE INDEX IF NOT EXISTS idx_posts_species_tags  ON posts USING GIN (species_tags);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT USING (true);

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE USING (auth.uid() = user_id);

-- ── Likes ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes (post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes (user_id);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes"
  ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE USING (auth.uid() = user_id);
