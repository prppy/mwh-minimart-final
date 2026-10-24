-- =============================================================================
-- Fold "Instant Noodles, BOWL" into the Instant Noodles size dropdown.
--
-- The catalogue shows two Bowl items:
--   * "Instant Noodles, BOWL" (staff-added, has a photo), on its own card, and
--   * "Instant Noodles – Bowl" (from minimart_update.sql, no photo), in the
--     Instant Noodles dropdown.
-- This keeps the photo row, puts it in the dropdown as the Bowl size, and
-- deletes the photo-less copy.
--
-- HOW TO RUN: paste the whole file into the Supabase SQL editor and run it.
-- Safe to run more than once.
-- =============================================================================

BEGIN;

-- 1. Delete the photo-less copy, but only while the staff row still exists,
--    and never if it has been redeemed.
DELETE FROM "public"."MWH_Product_Category" pc
USING "public"."MWH_Product" p
WHERE pc."Product_ID" = p."Product_ID"
  AND p."Product_Name" = 'Instant Noodles – Bowl'
  AND COALESCE(p."Image_URL", '') = ''
  AND EXISTS (SELECT 1 FROM "public"."MWH_Product" o WHERE o."Product_Name" = 'Instant Noodles, BOWL')
  AND NOT EXISTS (SELECT 1 FROM "public"."MWH_Redemption" r WHERE r."Product_ID" = p."Product_ID");

DELETE FROM "public"."MWH_Product" p
WHERE p."Product_Name" = 'Instant Noodles – Bowl'
  AND COALESCE(p."Image_URL", '') = ''
  AND EXISTS (SELECT 1 FROM "public"."MWH_Product" o WHERE o."Product_Name" = 'Instant Noodles, BOWL')
  AND NOT EXISTS (SELECT 1 FROM "public"."MWH_Redemption" r WHERE r."Product_ID" = p."Product_ID");

-- 2. Rename the staff row and put it in the Instant Noodles group
UPDATE "public"."MWH_Product" p
SET "Product_Name"        = 'Instant Noodles – Bowl',
    "Product_Group"       = 'Instant Noodles',
    "Tier_Label"          = 'Bowl',
    "Category_ID"         = (SELECT "Category_ID" FROM "public"."MWH_Category" WHERE "Category_Name" = 'Food'),
    "Type_ID"             = COALESCE(p."Type_ID", (SELECT "Type_ID" FROM "public"."MWH_Type" WHERE "Type_Name" = 'Daily')),
    "Product_Description" = 'Various brands – subject to availability'
WHERE p."Product_Name" = 'Instant Noodles, BOWL';

COMMIT;

-- Check: Instant Noodles should list Cup and Bowl once each
SELECT "Product_ID", "Product_Name", "Tier_Label", "Points", "Image_URL" IS NOT NULL AS has_photo
FROM "public"."MWH_Product"
WHERE "Product_Group" = 'Instant Noodles' OR "Product_Name" LIKE 'Instant Noodles%'
ORDER BY "Points";
