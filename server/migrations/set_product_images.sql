-- =============================================================================
-- Point products at the real product photos in Supabase Storage.
-- Photos come from Open Food Facts / Open Beauty Facts (CC BY-SA 3.0) and
-- Wikimedia Commons (various free licences); see photo-credits.txt for each.
--
-- BEFORE RUNNING:
--   1. Supabase dashboard -> Storage -> New bucket, name it product-images and
--      tick "Public bucket".
--   2. Open the bucket and drag in every file from the mwh-product-images
--      folder (product-61.webp, product-62.webp, ...). Keep the file names.
--
-- HOW TO RUN: paste the whole file into the Supabase SQL editor and run it.
-- Safe to run more than once. Products not listed keep their current photo.
-- =============================================================================

UPDATE "public"."MWH_Product" p
SET "Image_URL" = 'https://iwwjulkymtsxipbxvaha.supabase.co/storage/v1/object/public/product-images/product-' || p."Product_ID" || '.webp'
WHERE p."Product_ID" IN (
  61, 62, 63, 64, 65, 66, 67, 68, 70, 71, 74, 100,
  105, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127,
  128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139,
  141, 142, 143, 144, 146, 147, 149, 150, 151, 152, 153, 154,
  155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166,
  167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178,
  179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190,
  191
);

-- Check: each listed product should now show its new photo link
SELECT "Product_ID", "Product_Name", "Image_URL"
FROM "public"."MWH_Product"
WHERE "Image_URL" LIKE '%/product-images/%'
ORDER BY "Product_ID";
