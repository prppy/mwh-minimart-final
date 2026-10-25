-- =============================================================================
-- Remove "Energy Drink" from the catalogue.
--
-- Deletes the product only if it has never been redeemed. If it has, nothing
-- is deleted; hide it instead by unticking "Available" in the product editor.
--
-- HOW TO RUN: paste the whole file into the Supabase SQL editor and run it.
-- Safe to run more than once.
-- =============================================================================

BEGIN;

DELETE FROM "public"."MWH_Product_Category" pc
USING "public"."MWH_Product" p
WHERE pc."Product_ID" = p."Product_ID"
  AND p."Product_Name" = 'Energy Drink'
  AND NOT EXISTS (SELECT 1 FROM "public"."MWH_Redemption" r WHERE r."Product_ID" = p."Product_ID");

DELETE FROM "public"."MWH_Product" p
WHERE p."Product_Name" = 'Energy Drink'
  AND NOT EXISTS (SELECT 1 FROM "public"."MWH_Redemption" r WHERE r."Product_ID" = p."Product_ID");

COMMIT;

-- Check: should return no rows
SELECT "Product_ID", "Product_Name" FROM "public"."MWH_Product" WHERE "Product_Name" = 'Energy Drink';
