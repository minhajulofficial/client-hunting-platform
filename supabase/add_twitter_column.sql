-- Migration: Add twitter column to leads table
-- Run this in Supabase SQL Editor if the column doesn't exist

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'twitter') THEN
    ALTER TABLE leads ADD COLUMN twitter text;
  END IF;
END $$;
