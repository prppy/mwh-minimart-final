-- Manual migration: Add screensaver images table
-- This is SAFE - it only creates a new table, doesn't touch existing data

CREATE TABLE IF NOT EXISTS "MWH_Screensaver_Image" (
    "id" SERIAL PRIMARY KEY,
    "image_url" VARCHAR(500) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster ordering
CREATE INDEX IF NOT EXISTS "idx_screensaver_display_order" 
ON "MWH_Screensaver_Image"("display_order");
