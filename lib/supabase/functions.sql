-- Run this in Supabase SQL Editor to add the decrement_credits function

CREATE OR REPLACE FUNCTION decrement_credits(user_id UUID, amount INT DEFAULT 1)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET letter_credits = GREATEST(0, letter_credits - amount)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also create the letter-photos storage bucket
-- Go to Supabase → Storage → New Bucket
-- Name: letter-photos
-- Public: YES (so photos can be included in printed letters)
