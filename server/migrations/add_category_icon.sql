-- Add Icon_Name column to MWH_Task_Category table
ALTER TABLE "public"."MWH_Task_Category"
ADD COLUMN IF NOT EXISTS "Icon_Name" VARCHAR(50);
