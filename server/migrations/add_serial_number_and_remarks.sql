-- Add Serial_Number and Remarks columns to MWH_Resident table
-- Run this migration against your PostgreSQL database

-- Create the remarks enum type
DO $$ BEGIN
    CREATE TYPE resident_remarks_enum AS ENUM ('discharged', 'ftr', 'abscondence', 'extended_homeleave');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add Serial_Number column (unique, nullable)
ALTER TABLE "public"."MWH_Resident"
ADD COLUMN IF NOT EXISTS "Serial_Number" VARCHAR(50) UNIQUE;

-- Add Remarks column
ALTER TABLE "public"."MWH_Resident"
ADD COLUMN IF NOT EXISTS "Remarks" resident_remarks_enum;
