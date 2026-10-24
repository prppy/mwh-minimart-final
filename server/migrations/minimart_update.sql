-- =============================================================================
-- Minimart update: product tiers, purchase limits, pre-orders, redemption
-- tickets (orders), settings, and the hackathon-deck catalogue.
--
-- HOW TO RUN: paste the whole file into the Supabase SQL editor and run it
-- BEFORE deploying the matching server code. Safe to run more than once.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Product tiers, purchase limits, pre-order flag
-- -----------------------------------------------------------------------------
-- Tiers: products sharing a Product_Group (e.g. "Chocolates") show as one
-- catalogue item with a size dropdown; Tier_Label is the size (e.g. "Small").
ALTER TABLE "public"."MWH_Product" ADD COLUMN IF NOT EXISTS "Product_Group" VARCHAR(60);
ALTER TABLE "public"."MWH_Product" ADD COLUMN IF NOT EXISTS "Tier_Label" VARCHAR(30);
-- Max quantity per order (NULL = no limit beyond the global cap of 10)
ALTER TABLE "public"."MWH_Product" ADD COLUMN IF NOT EXISTS "Max_Per_Order" INT;
ALTER TABLE "public"."MWH_Product" ADD COLUMN IF NOT EXISTS "Is_Preorder" BOOLEAN NOT NULL DEFAULT false;
-- Tiered names ("Sweaters / Windbreaker / Hoodies – Premium") exceed the old 31-char limit
ALTER TABLE "public"."MWH_Product" ALTER COLUMN "Product_Name" TYPE VARCHAR(100);

-- -----------------------------------------------------------------------------
-- 2. Redemption tickets (orders)
-- -----------------------------------------------------------------------------
-- Each redemption transaction is an order with a ticket such as "O-042"
-- (counter order) or "P-007" (pre-order). Numbers restart at 001 every day.
--   Counter order:  pending   -> collected            (or expired / cancelled)
--   Pre-order:      preordered -> ready -> collected  (or expired / cancelled)
-- Expired and cancelled orders have their points refunded (Refunded_At set).
ALTER TABLE "public"."MWH_Transaction" ADD COLUMN IF NOT EXISTS "Ticket_Code" VARCHAR(10);
ALTER TABLE "public"."MWH_Transaction" ADD COLUMN IF NOT EXISTS "Order_Type" VARCHAR(10);
ALTER TABLE "public"."MWH_Transaction" ADD COLUMN IF NOT EXISTS "Order_Status" VARCHAR(20);
ALTER TABLE "public"."MWH_Transaction" ADD COLUMN IF NOT EXISTS "Created_At" TIMESTAMPTZ DEFAULT now();
ALTER TABLE "public"."MWH_Transaction" ADD COLUMN IF NOT EXISTS "Ready_At" TIMESTAMPTZ;
ALTER TABLE "public"."MWH_Transaction" ADD COLUMN IF NOT EXISTS "Collected_At" TIMESTAMPTZ;
ALTER TABLE "public"."MWH_Transaction" ADD COLUMN IF NOT EXISTS "Expires_At" TIMESTAMPTZ;
ALTER TABLE "public"."MWH_Transaction" ADD COLUMN IF NOT EXISTS "Refunded_At" TIMESTAMPTZ;

-- Speeds up the expiry job and the staff order list
CREATE INDEX IF NOT EXISTS "MWH_Transaction_Order_Status_idx"
  ON "public"."MWH_Transaction" ("Order_Status", "Expires_At");

-- Daily ticket counter per prefix ('O' or 'P'); incremented atomically
CREATE TABLE IF NOT EXISTS "public"."MWH_Ticket_Counter" (
  "Counter_Date" DATE        NOT NULL,
  "Prefix"       VARCHAR(1)  NOT NULL,
  "Last_Number"  INT         NOT NULL DEFAULT 0,
  CONSTRAINT "MWH_Ticket_Counter_pkey" PRIMARY KEY ("Counter_Date", "Prefix")
);

-- -----------------------------------------------------------------------------
-- 3. App settings (key/value)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."MWH_Setting" (
  "Setting_Key"   VARCHAR(50)  NOT NULL,
  "Setting_Value" VARCHAR(255) NOT NULL,
  "Updated_At"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT "MWH_Setting_pkey" PRIMARY KEY ("Setting_Key")
);

-- Ticket expiry: 0 = end of the same day (default), N = end of the day N days later
INSERT INTO "public"."MWH_Setting" ("Setting_Key", "Setting_Value")
VALUES ('ticket_expiry_days', '0')
ON CONFLICT ("Setting_Key") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Product categories
-- -----------------------------------------------------------------------------
UPDATE "public"."MWH_Category"
SET "Category_Name" = 'Beverages'
WHERE "Category_Name" = 'Drinks'
  AND NOT EXISTS (SELECT 1 FROM "public"."MWH_Category" WHERE "Category_Name" = 'Beverages');

INSERT INTO "public"."MWH_Category" ("Category_Name")
SELECT v.name FROM (VALUES ('Beverages'), ('Desserts'), ('Sports Wear')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "public"."MWH_Category" c WHERE c."Category_Name" = v.name);

-- -----------------------------------------------------------------------------
-- 5. Voucher categories (subtasks are added by staff in the Vouchers page)
-- -----------------------------------------------------------------------------
INSERT INTO "public"."MWH_Task_Category" ("Task_Category_Name", "Task_Category_Description", "Icon_Name")
SELECT v.name, v.description, v.icon
FROM (VALUES
  ('Memorisation',               'Reading and memorising the Quran',          'book'),
  ('Abscondence Free Challenge', 'Keeping a clean record with no abscondence', 'award'),
  ('Leadership Role',            'Taking on a leadership role',               'users'),
  ('Volunteer Work',             'Volunteering to help others',               'hand-heart'),
  ('Room Cleanliness',           'Keeping your room clean and tidy',          'bed'),
  ('Academic Improvement',       'Improving your academic results',           'trending-up'),
  ('Academic Excellence',        'Achieving excellent academic results',      'trophy')
) AS v(name, description, icon)
WHERE NOT EXISTS (SELECT 1 FROM "public"."MWH_Task_Category" t WHERE t."Task_Category_Name" = v.name);

-- Give existing categories an icon if they have none
UPDATE "public"."MWH_Task_Category" SET "Icon_Name" = 'book'
WHERE "Task_Category_Name" = 'Memorisation' AND "Icon_Name" IS NULL;
UPDATE "public"."MWH_Task_Category" SET "Icon_Name" = 'award'
WHERE "Task_Category_Name" = 'Abscondence Free Challenge' AND "Icon_Name" IS NULL;

-- -----------------------------------------------------------------------------
-- 6. Catalogue (deck slides 7–44): one row per tier.
--    Items without tiers have NULL group/tier.
--    Beverage "Special Deals" are added by staff (category Beverages,
--    product group "Special Deals"), so none are seeded here.
-- -----------------------------------------------------------------------------
INSERT INTO "public"."MWH_Product" (
  "Product_Name", "Product_Description", "Points", "Available", "Category_ID",
  "Type_ID", "Product_Group", "Tier_Label", "Is_Preorder"
)
SELECT
  CASE WHEN v.tier IS NULL THEN v.grp ELSE v.grp || ' – ' || v.tier END,
  v.description,
  v.points,
  true,
  c."Category_ID",
  t."Type_ID",
  CASE WHEN v.tier IS NULL THEN NULL ELSE v.grp END,
  v.tier,
  v.preorder
FROM (VALUES
  -- category,       type,       group,                              tier,              points, pre-order, description
  ('Beverages',     'Daily',    'Assorted Carbonated Drinks',       'Small',            10, false, 'Various brands – subject to availability'),
  ('Beverages',     'Daily',    'Assorted Carbonated Drinks',       'Medium',           20, false, 'Various brands – subject to availability'),
  ('Beverages',     'Daily',    'Assorted Carbonated Drinks',       'Large',            30, false, 'Various brands – subject to availability'),
  ('Beverages',     'Daily',    'Assorted Non-Carbonated Drinks',   'Small',            10, false, 'Various brands – subject to availability'),
  ('Beverages',     'Daily',    'Assorted Non-Carbonated Drinks',   'Medium',           20, false, 'Various brands – subject to availability'),
  ('Beverages',     'Daily',    'Assorted Non-Carbonated Drinks',   'Large',            30, false, 'Various brands – subject to availability'),
  ('Food',          'Daily',    'Chocolates',                       'Small',            10, false, 'Various brands – subject to availability'),
  ('Food',          'Daily',    'Chocolates',                       'Medium',           20, false, 'Various brands – subject to availability'),
  ('Food',          'Daily',    'Chocolates',                       'Large',            30, false, 'Various brands – subject to availability'),
  ('Food',          'Daily',    'Chips',                            'Small',            10, false, 'Various brands – subject to availability'),
  ('Food',          'Daily',    'Chips',                            'Large',            30, false, 'Various brands – subject to availability'),
  ('Food',          'Daily',    'Crackers',                         'Small',            10, false, 'Various brands – subject to availability'),
  ('Food',          'Daily',    'Crackers',                         'Large',            30, false, 'Various brands – subject to availability'),
  ('Food',          'Daily',    'Instant Noodles',                  'Cup',              10, false, 'Various brands – subject to availability'),
  ('Food',          'Daily',    'Instant Noodles',                  'Bowl',             40, false, 'Various brands – subject to availability'),
  ('Food',          'Daily',    'Snacks',                           'Mini',              5, false, 'Various brands – subject to availability'),
  ('Food',          'Daily',    'Snacks',                           'Small',            10, false, 'Various brands – subject to availability'),
  ('Food',          'Daily',    'Snacks',                           'Medium',           20, false, 'Various brands – subject to availability'),
  ('Food',          'Daily',    'Snacks',                           'Large',            30, false, 'Various brands – subject to availability'),
  ('Desserts',      'Daily',    'Ice Cream',                        'Small',            10, false, 'Various brands – subject to availability'),
  ('Desserts',      'Daily',    'Ice Cream',                        'Medium',           20, false, 'Various brands – subject to availability'),
  ('Desserts',      'Daily',    'Ice Cream',                        'Large / Premium',  30, false, 'Various brands – subject to availability'),
  ('Desserts',      'Daily',    'Jelly',                            'Small',            10, false, 'Various brands – subject to availability'),
  ('Desserts',      'Daily',    'Jelly',                            'Medium',           20, false, 'Various brands – subject to availability'),
  ('Desserts',      'Daily',    'Jelly',                            'Large',            30, false, 'Various brands – subject to availability'),
  ('Personal Care', 'Daily',    'Deodorant',                        NULL,               30, false, NULL),
  ('Personal Care', 'Daily',    'Facial Wash',                      NULL,               50, false, NULL),
  ('Personal Care', 'Daily',    'Premium Toothbrush',               NULL,               50, false, NULL),
  ('Personal Care', 'Daily',    'Hair Cream',                       NULL,               50, false, NULL),
  ('Personal Care', 'Daily',    'Cooling Powder',                   NULL,               30, false, NULL),
  ('Apparels',      'Showcase', 'T-Shirts / Jersey',                'Pre-loved',        80, false, NULL),
  ('Apparels',      'Showcase', 'T-Shirts / Jersey',                'Standard',        200, false, NULL),
  ('Apparels',      'Showcase', 'T-Shirts / Jersey',                'Premium',         300, false, NULL),
  ('Apparels',      'Showcase', 'Sweaters / Windbreaker / Hoodies', 'Pre-loved',       150, false, NULL),
  ('Apparels',      'Showcase', 'Sweaters / Windbreaker / Hoodies', 'Standard',        250, false, NULL),
  ('Apparels',      'Showcase', 'Sweaters / Windbreaker / Hoodies', 'Premium',         400, false, NULL),
  ('Apparels',      'Showcase', 'Pants',                            'Pre-loved',       150, false, NULL),
  ('Apparels',      'Showcase', 'Pants',                            'Standard',        250, false, NULL),
  ('Apparels',      'Showcase', 'Pants',                            'Premium',         400, false, NULL),
  ('Apparels',      'Showcase', 'Undergarments / Boxers',           'Standard',         30, false, NULL),
  ('Apparels',      'Showcase', 'Undergarments / Boxers',           'Premium',          80, false, NULL),
  ('Apparels',      'Showcase', 'Shorts',                           'Standard',         50, false, NULL),
  ('Apparels',      'Showcase', 'Shorts',                           'Premium',         150, false, NULL),
  ('Apparels',      'Showcase', 'Socks',                            'Standard',         50, false, NULL),
  ('Apparels',      'Showcase', 'Socks',                            'Premium',         200, false, NULL),
  ('Sports Wear',   'Showcase', 'Soccer Socks',                     NULL,              200, false, NULL),
  ('Sports Wear',   'Showcase', 'Shin Pad',                         NULL,              200, false, NULL),
  ('Sports Wear',   'Showcase', 'Soccer Boots',                     NULL,             1000, true,  'Pre-order: points are deducted now and staff will tell you when it is ready to collect'),
  ('Sports Wear',   'Showcase', 'Futsal Shoes',                     NULL,              600, true,  'Pre-order: points are deducted now and staff will tell you when it is ready to collect'),
  ('Sports Wear',   'Showcase', 'Keeper''s Glove',                  'Standard',        300, false, NULL),
  ('Sports Wear',   'Showcase', 'Keeper''s Glove',                  'Premium',         500, false, NULL),
  ('Accessories',   'Showcase', 'Watch',                            'Standard',        150, false, NULL),
  ('Accessories',   'Showcase', 'Watch',                            'Premium',         600, false, NULL),
  ('Accessories',   'Showcase', 'Wallets',                          'Standard',        150, false, NULL),
  ('Accessories',   'Showcase', 'Wallets',                          'Premium',         300, false, NULL),
  ('Accessories',   'Showcase', 'Cap',                              'Standard',        150, false, NULL),
  ('Accessories',   'Showcase', 'Cap',                              'Premium',         500, false, NULL),
  ('Accessories',   'Showcase', 'Shades',                           'Standard',        300, false, NULL),
  ('Accessories',   'Showcase', 'Shades',                           'Premium',         500, false, NULL),
  ('Accessories',   'Showcase', 'Backpack Bags',                    'Standard',        200, false, NULL),
  ('Accessories',   'Showcase', 'Backpack Bags',                    'Premium',         350, false, NULL),
  ('Accessories',   'Showcase', 'Crossbody Bags',                   'Standard',        200, false, NULL),
  ('Accessories',   'Showcase', 'Crossbody Bags',                   'Premium',         350, false, NULL),
  ('Electronics',   'Showcase', 'Handphone (Standard)',             '64 GB',          4000, false, NULL),
  ('Electronics',   'Showcase', 'Handphone (Standard)',             '128 GB',         6000, false, NULL),
  ('Electronics',   'Showcase', 'Handphone (Standard)',             '256 GB',         8000, false, NULL),
  ('Electronics',   'Showcase', 'Handphone (Premium)',              '64 GB',          5000, false, NULL),
  ('Electronics',   'Showcase', 'Handphone (Premium)',              '128 GB',         8000, false, NULL),
  ('Electronics',   'Showcase', 'Handphone (Premium)',              '256 GB',        10000, false, NULL),
  ('Electronics',   'Showcase', 'Powerbank',                        '5,000 mAh',      3000, false, NULL),
  ('Electronics',   'Showcase', 'Powerbank',                        '10,000 mAh',     6000, false, NULL),
  ('Electronics',   'Showcase', 'Adapter',                          NULL,              200, false, NULL),
  ('Electronics',   'Showcase', 'Cable',                            NULL,              150, false, NULL),
  ('Electronics',   'Showcase', 'Ear Bud',                          'Standard',        200, false, NULL),
  ('Electronics',   'Showcase', 'Ear Bud',                          'Premium',         500, false, NULL),
  ('Electronics',   'Showcase', 'Headphones',                       'Standard',        500, false, NULL),
  ('Electronics',   'Showcase', 'Headphones',                       'Premium',        1000, false, NULL)
) AS v(category, type_name, grp, tier, points, preorder, description)
JOIN "public"."MWH_Category" c ON c."Category_Name" = v.category
LEFT JOIN "public"."MWH_Type" t ON t."Type_Name" = v.type_name
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."MWH_Product" p
  WHERE p."Product_Name" = CASE WHEN v.tier IS NULL THEN v.grp ELSE v.grp || ' – ' || v.tier END
);

COMMIT;
