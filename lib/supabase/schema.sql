-- ============================================================
-- BOOTMAIL DATABASE SCHEMA
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific data
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  plan          TEXT DEFAULT 'free' CHECK (plan IN ('free','pro','family')),
  stripe_customer_id TEXT,
  letter_credits INT DEFAULT 0,
  gift_card_balance DECIMAL(10,2) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RECRUITS ────────────────────────────────────────────
CREATE TABLE recruits (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  branch        TEXT NOT NULL CHECK (branch IN ('army','marines','navy','airforce','coastguard','spaceforce')),
  ship_date     DATE,
  grad_date     DATE,
  training_base TEXT,
  -- Mailing address
  address_line1 TEXT,
  address_line2 TEXT,
  city          TEXT,
  state         TEXT,
  zip           TEXT,
  -- Training info
  company       TEXT,
  platoon       TEXT,
  regiment      TEXT,
  -- Status
  status        TEXT DEFAULT 'training' CHECK (status IN ('pre-training','training','ait','active','deployed','separated')),
  photo_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LETTER SQUAD ────────────────────────────────────────
-- Multiple family members connected to one recruit
CREATE TABLE squad_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruit_id  UUID REFERENCES recruits(id) ON DELETE CASCADE,
  profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT DEFAULT 'member' CHECK (role IN ('owner','member')),
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recruit_id, profile_id)
);

-- ─── LETTERS ─────────────────────────────────────────────
CREATE TABLE letters (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recruit_id    UUID REFERENCES recruits(id) ON DELETE CASCADE,
  -- Content
  body          TEXT NOT NULL,
  photo_urls    TEXT[] DEFAULT '{}',
  -- Addons
  include_newsletter  BOOLEAN DEFAULT FALSE,
  gift_card_amount    DECIMAL(10,2),
  -- Fulfillment
  status        TEXT DEFAULT 'draft' CHECK (status IN ('draft','paid','processing','printed','mailed','delivered')),
  lob_letter_id TEXT,   -- Lob.com letter ID
  tracking_number TEXT,
  -- Pricing
  price_paid    DECIMAL(10,2),
  -- Timestamps
  submitted_at  TIMESTAMPTZ,
  printed_at    TIMESTAMPTZ,
  mailed_at     TIMESTAMPTZ,
  delivered_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CARE PACKAGES ───────────────────────────────────────
CREATE TABLE packages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recruit_id    UUID REFERENCES recruits(id) ON DELETE CASCADE,
  -- Package details
  package_type  TEXT NOT NULL, -- 'essentials','boost','comfort','full_send','custom'
  items         JSONB DEFAULT '[]', -- [{id, name, qty, price}]
  personal_note TEXT,
  -- Fulfillment
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','packing','shipped','delivered')),
  tracking_number TEXT,
  ship_date     DATE,
  -- Pricing
  subtotal      DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  total         DECIMAL(10,2),
  -- Timestamps
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  shipped_at    TIMESTAMPTZ,
  delivered_at  TIMESTAMPTZ
);

-- ─── PRODUCTS (Care Package Items) ───────────────────────
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT,
  category      TEXT, -- 'hygiene','food','clothing','stationery','comfort','gear'
  price         DECIMAL(10,2) NOT NULL,
  cost          DECIMAL(10,2), -- your wholesale cost
  image_url     TEXT,
  weight_oz     DECIMAL(6,2),
  -- Branch restrictions
  allowed_branches TEXT[] DEFAULT '{army,marines,navy,airforce,coastguard}',
  -- Training phase
  allowed_phases TEXT[] DEFAULT '{basic,ait,active,deployed}',
  -- Inventory
  in_stock      BOOLEAN DEFAULT TRUE,
  stock_qty     INT DEFAULT 999,
  -- Flags
  drill_sergeant_approved BOOLEAN DEFAULT FALSE, -- safe for basic training
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GIFT CARDS ──────────────────────────────────────────
CREATE TABLE gift_cards (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          TEXT UNIQUE NOT NULL,
  type          TEXT DEFAULT 'bootmail' CHECK (type IN ('bootmail','letters')),
  -- Value
  initial_amount DECIMAL(10,2) NOT NULL,
  remaining_amount DECIMAL(10,2) NOT NULL,
  -- Ownership
  purchased_by  UUID REFERENCES profiles(id),
  redeemed_by   UUID REFERENCES profiles(id),
  -- Status
  is_active     BOOLEAN DEFAULT TRUE,
  expires_at    TIMESTAMPTZ, -- NULL = never expires
  redeemed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDERS ──────────────────────────────────────────────
CREATE TABLE orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- What was ordered
  order_type    TEXT NOT NULL CHECK (order_type IN ('letters','package','book','gear','gift_card','subscription')),
  line_items    JSONB DEFAULT '[]',
  -- Payment
  stripe_payment_intent TEXT,
  stripe_session_id TEXT,
  amount_subtotal DECIMAL(10,2),
  amount_discount DECIMAL(10,2) DEFAULT 0,
  amount_total  DECIMAL(10,2),
  currency      TEXT DEFAULT 'usd',
  -- Status
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','fulfilled','refunded','cancelled')),
  -- References
  letter_ids    UUID[],
  package_id    UUID REFERENCES packages(id),
  -- Timestamps
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LEGACY BOOKS ────────────────────────────────────────
CREATE TABLE legacy_books (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruit_id    UUID REFERENCES recruits(id) ON DELETE CASCADE,
  owner_id      UUID REFERENCES profiles(id),
  -- Config
  tier          TEXT DEFAULT 'basic' CHECK (tier IN ('basic','legacy','family','fullstory','deluxe')),
  cover_style   TEXT DEFAULT 'branch',
  cover_photo_url TEXT,
  dedication    TEXT,
  layout_style  TEXT DEFAULT 'yearbook',
  -- Multi-sender
  include_sender_ids UUID[] DEFAULT '{}',
  -- Signing
  signing_slug  TEXT UNIQUE,
  signing_open  BOOLEAN DEFAULT FALSE,
  signing_closes_at TIMESTAMPTZ,
  -- Extra content
  bonus_photo_urls TEXT[] DEFAULT '{}',
  recruit_letters TEXT, -- text of letters recruit wrote back
  -- Order/fulfillment
  status        TEXT DEFAULT 'building' CHECK (status IN ('building','signing','preview','ordered','printing','shipped','delivered')),
  blurb_order_id TEXT,
  tracking_number TEXT,
  price_paid    DECIMAL(10,2),
  -- Timestamps
  ordered_at    TIMESTAMPTZ,
  shipped_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BOOK SIGNATURES ─────────────────────────────────────
CREATE TABLE book_signatures (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id       UUID REFERENCES legacy_books(id) ON DELETE CASCADE,
  -- Signer info (no account required)
  signer_name   TEXT NOT NULL,
  signer_city   TEXT,
  signer_state  TEXT,
  message       TEXT NOT NULL CHECK (char_length(message) <= 300),
  font_choice   TEXT DEFAULT 'hometown',
  doodle_svg    TEXT, -- SVG string of their doodle
  is_anonymous  BOOLEAN DEFAULT FALSE,
  -- Moderation
  approved      BOOLEAN DEFAULT TRUE,
  -- Timestamps
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WAITLIST ────────────────────────────────────────────
CREATE TABLE waitlist (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email     TEXT UNIQUE NOT NULL,
  name      TEXT,
  branch    TEXT,
  source    TEXT, -- where they came from
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUBSCRIPTIONS ───────────────────────────────────────
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id            UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id       TEXT,
  plan                  TEXT CHECK (plan IN ('pro','family')),
  status                TEXT, -- active, canceled, past_due, etc.
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE letters          ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_books     ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_signatures  ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions    ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Recruits: users can see recruits they own or are squad members of
CREATE POLICY "recruits_own" ON recruits
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "recruits_squad" ON recruits
  FOR SELECT USING (
    id IN (SELECT recruit_id FROM squad_members WHERE profile_id = auth.uid())
  );

-- Letters: users can see their own letters
CREATE POLICY "letters_own" ON letters
  FOR ALL USING (auth.uid() = sender_id);

-- Packages: users can see their own packages
CREATE POLICY "packages_own" ON packages
  FOR ALL USING (auth.uid() = sender_id);

-- Orders: users can see their own orders
CREATE POLICY "orders_own" ON orders
  FOR ALL USING (auth.uid() = profile_id);

-- Legacy books: owners can see their books
CREATE POLICY "books_own" ON legacy_books
  FOR ALL USING (auth.uid() = owner_id);

-- Book signatures: public insert (no auth needed for signing), owners can read
CREATE POLICY "signatures_insert" ON book_signatures
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "signatures_read_owner" ON book_signatures
  FOR SELECT USING (
    book_id IN (SELECT id FROM legacy_books WHERE owner_id = auth.uid())
  );

-- Gift cards: purchaser or redeemer can see
CREATE POLICY "gift_cards_own" ON gift_cards
  FOR SELECT USING (
    auth.uid() = purchased_by OR auth.uid() = redeemed_by
  );

-- Products: everyone can read (public catalog)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (is_active = TRUE);

-- Waitlist: anyone can insert
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waitlist_insert" ON waitlist
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER recruits_updated_at
  BEFORE UPDATE ON recruits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate unique signing slug for books
CREATE OR REPLACE FUNCTION generate_signing_slug(recruit_name TEXT, branch TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
  exists BOOLEAN;
BEGIN
  slug := lower(regexp_replace(recruit_name, '[^a-zA-Z0-9]', '-', 'g'))
    || '-' || lower(branch)
    || '-' || to_char(NOW(), 'YYYY');

  SELECT EXISTS(SELECT 1 FROM legacy_books WHERE signing_slug = slug) INTO exists;
  IF exists THEN
    slug := slug || '-' || floor(random() * 9000 + 1000)::TEXT;
  END IF;

  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DATA — Care Package Products
-- ============================================================

INSERT INTO products (name, description, category, price, cost, allowed_phases, drill_sergeant_approved) VALUES
-- Hygiene (basic training safe)
('Dove Unscented Bar Soap', '3-pack, unscented', 'hygiene', 2.99, 0.90, '{basic,ait,active,deployed}', TRUE),
('Gold Bond Foot Powder', '4oz, soothes tired feet', 'hygiene', 4.99, 1.50, '{basic,ait,active,deployed}', TRUE),
('Unscented Deodorant (Degree)', 'Stick, 2.7oz, unscented', 'hygiene', 4.49, 1.20, '{basic,ait,active,deployed}', TRUE),
('Blister Moleskin Pads', '10-pack, foot blister protection', 'comfort', 5.99, 1.00, '{basic,ait,active,deployed}', TRUE),
('Sugar-Free Cough Drops (Halls)', '30-count, menthol, sugar-free', 'health', 3.99, 0.80, '{basic,ait,active,deployed}', TRUE),
('Unscented Lip Balm', '3-pack, ChapStick unscented', 'hygiene', 3.49, 0.50, '{basic,ait,active,deployed}', TRUE),
('Disposable Razors', '12-pack BIC disposable', 'hygiene', 4.99, 1.00, '{basic,ait,active,deployed}', TRUE),
('Dental Floss', '200 yards, waxed', 'hygiene', 2.99, 0.40, '{basic,ait,active,deployed}', TRUE),
('Foot Blister Bandages', '8-pack, waterproof', 'health', 4.99, 1.20, '{basic,ait,active,deployed}', TRUE),
('Cotton Swabs', '300-count', 'hygiene', 2.49, 0.40, '{basic,ait,active,deployed}', TRUE),
('Nail Clippers', 'Standard, no file', 'hygiene', 2.99, 0.60, '{basic,ait,active,deployed}', TRUE),
('Petroleum Jelly (Travel)', '1.75oz travel size', 'hygiene', 2.49, 0.50, '{basic,ait,active,deployed}', TRUE),

-- Stationery (basic training safe)
('Stamp Book', '20 Forever stamps', 'stationery', 14.99, 13.20, '{basic,ait,active,deployed}', TRUE),
('Black Ink Pens (5-pack)', 'BIC ballpoint, black', 'stationery', 3.99, 0.80, '{basic,ait,active,deployed}', TRUE),
('Small Notebook/Journal', 'Pocket-size, blank lined', 'stationery', 4.49, 1.00, '{basic,ait,active,deployed}', TRUE),
('Pre-Stamped Envelopes (10)', 'Return envelopes, pre-addressed optional', 'stationery', 9.99, 8.00, '{basic,ait,active,deployed}', TRUE),

-- Clothing (basic training)
('White Ankle Socks (3-pack)', 'No-show, no logo, white', 'clothing', 7.99, 2.50, '{basic,ait,active,deployed}', TRUE),
('White Brief Underwear (3-pack)', 'Plain white, no logos', 'clothing', 12.99, 4.00, '{basic,ait,active,deployed}', TRUE),
('Shoe Insoles (Dr. Scholls)', 'Gel comfort inserts', 'clothing', 8.99, 3.00, '{basic,ait,active,deployed}', TRUE),

-- Comfort / Other (basic training safe)
('Sewing Kit (Mini)', 'Thread, needles, buttons', 'comfort', 3.49, 0.75, '{basic,ait,active,deployed}', TRUE),
('Combination Lock', 'Black, 4-digit combo', 'comfort', 8.99, 3.00, '{basic,ait,active,deployed}', TRUE),
('Icy Hot Cream (Travel)', '1oz travel size', 'health', 4.99, 1.50, '{basic,ait,active,deployed}', TRUE),

-- Post-training / AIT / Deployed (food, snacks, etc.)
('Beef Jerky (Original)', '3oz Jack Links', 'food', 5.99, 2.00, '{ait,active,deployed}', FALSE),
('Protein Bars (4-pack)', 'Quest, assorted flavors', 'food', 8.99, 3.50, '{ait,active,deployed}', FALSE),
('Trail Mix (Tropical)', '6oz bag', 'food', 4.99, 1.50, '{ait,active,deployed}', FALSE),
('Instant Coffee Packets (10)', 'Starbucks Via, assorted', 'food', 9.99, 4.00, '{ait,active,deployed}', FALSE),
('Gatorade Powder Packets (8)', 'Assorted flavors', 'food', 6.99, 2.00, '{ait,active,deployed}', FALSE),
('Hot Sauce Mini Bottle', 'Tabasco 2oz', 'food', 3.99, 0.75, '{ait,active,deployed}', FALSE),
('Peanut Butter Packets (6)', 'Justin s single-serve', 'food', 7.99, 3.00, '{ait,active,deployed}', FALSE),
('Ramen Noodles (6-pack)', 'Assorted flavors', 'food', 5.99, 1.50, '{ait,active,deployed}', FALSE),
('Phone Charging Cable (6ft)', 'USB-C + Lightning', 'tech', 9.99, 2.50, '{ait,active,deployed}', FALSE),
('Portable Phone Stand', 'Foldable aluminum', 'tech', 7.99, 2.00, '{ait,active,deployed}', FALSE);

-- ============================================================
-- DONE ✓
-- Your BootMail database is ready.
-- ============================================================
