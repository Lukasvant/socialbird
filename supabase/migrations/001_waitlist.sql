-- Migration: 001_waitlist
-- Creates the waitlist table with RLS policies

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  referral_source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Public insert, no read
CREATE POLICY "Anyone can join waitlist"
  ON waitlist
  FOR INSERT
  WITH CHECK (true);
