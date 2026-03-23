-- Migration: 002_profiles_auth
-- Creates profiles table extending auth.users, with PostGIS support

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  location_name TEXT,
  location_point GEOGRAPHY(POINT, 4326),
  interests TEXT[] DEFAULT '{}',
  is_onboarded BOOLEAN DEFAULT false,
  allow_dms TEXT DEFAULT 'mutual_only' CHECK (allow_dms IN ('everyone', 'mutual_only', 'nobody')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIST (location_point);
CREATE INDEX IF NOT EXISTS idx_profiles_interests ON profiles USING GIN (interests);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
