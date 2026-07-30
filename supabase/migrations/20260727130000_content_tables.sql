-- =============================================
-- CONTENT TABLES: Products, Talent, Collabs, Site Events, Milestones, Recaps
-- All idempotent (IF NOT EXISTS / DROP IF EXISTS)
-- =============================================

-- ===== PRODUCTS =====
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL DEFAULT 'Empire',
  price numeric(12,2) NOT NULL DEFAULT 0,
  tag text NOT NULL DEFAULT 'Empire',
  description text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS products_public_select ON public.products;
CREATE POLICY products_public_select ON public.products
  FOR SELECT TO anon, authenticated USING (active = true);

DROP POLICY IF EXISTS products_staff_all ON public.products;
CREATE POLICY products_staff_all ON public.products
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();


-- ===== TALENT ROSTER =====
CREATE TABLE IF NOT EXISTS public.talent_roster (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  stage_name text NOT NULL,
  talent_type text NOT NULL DEFAULT 'DJ',
  status text NOT NULL DEFAULT 'Available',
  bio text,
  avatar_url text,
  featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.talent_roster ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS talent_public_select ON public.talent_roster;
CREATE POLICY talent_public_select ON public.talent_roster
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS talent_staff_all ON public.talent_roster;
CREATE POLICY talent_staff_all ON public.talent_roster
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS talent_roster_set_updated_at ON public.talent_roster;
CREATE TRIGGER talent_roster_set_updated_at
  BEFORE UPDATE ON public.talent_roster
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();


-- ===== COLLABS =====
CREATE TABLE IF NOT EXISTS public.collabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  description text,
  partner_type text NOT NULL DEFAULT 'Beverage',
  logo_url text,
  featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.collabs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS collabs_public_select ON public.collabs;
CREATE POLICY collabs_public_select ON public.collabs
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS collabs_staff_all ON public.collabs;
CREATE POLICY collabs_staff_all ON public.collabs
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS collabs_set_updated_at ON public.collabs;
CREATE TRIGGER collabs_set_updated_at
  BEFORE UPDATE ON public.collabs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();


-- ===== SITE EVENTS (public events page) =====
CREATE TABLE IF NOT EXISTS public.site_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  event_date text NOT NULL,
  image_url text,
  tags text[] NOT NULL DEFAULT '{}',
  djs text,
  going_count int NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_events_public_select ON public.site_events;
CREATE POLICY site_events_public_select ON public.site_events
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS site_events_staff_all ON public.site_events;
CREATE POLICY site_events_staff_all ON public.site_events
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS site_events_set_updated_at ON public.site_events;
CREATE TRIGGER site_events_set_updated_at
  BEFORE UPDATE ON public.site_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();


-- ===== MILESTONES =====
CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_label text NOT NULL,
  title text NOT NULL,
  body text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS milestones_public_select ON public.milestones;
CREATE POLICY milestones_public_select ON public.milestones
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS milestones_staff_all ON public.milestones;
CREATE POLICY milestones_staff_all ON public.milestones
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS milestones_set_updated_at ON public.milestones;
CREATE TRIGGER milestones_set_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();


-- ===== RECAP EVENTS =====
CREATE TABLE IF NOT EXISTS public.recap_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_date text NOT NULL,
  cover_url text,
  photo_count int NOT NULL DEFAULT 0,
  video_count int NOT NULL DEFAULT 0,
  bundle_price numeric(12,2) NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recap_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recap_public_select ON public.recap_events;
CREATE POLICY recap_public_select ON public.recap_events
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS recap_staff_all ON public.recap_events;
CREATE POLICY recap_staff_all ON public.recap_events
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS recap_events_set_updated_at ON public.recap_events;
CREATE TRIGGER recap_events_set_updated_at
  BEFORE UPDATE ON public.recap_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();


-- ===== SEED MOCK DATA =====

-- Products
INSERT INTO public.products (name, brand, price, tag, sort_order) VALUES
  ('Empire Embroidered Hoodie', 'Empire', 4500, 'Empire', 1),
  ('Park & Puff Cap', 'Empire', 1500, 'Empire', 2),
  ('Double Apple Flavour Pack (3x)', 'Empire', 1200, 'Empire', 3),
  ('KES 5,000 Gift Voucher', 'Empire', 5000, 'Vouchers', 4),
  ('Kanyali - Tides Mix Vinyl', 'Kanyali Records', 3500, 'Collabs', 5),
  ('Lava Streetwear Tee', 'Lava Lab', 2200, 'Collabs', 6),
  ('Summer Tides Opening Night Ticket', 'Empire', 2500, 'Tickets', 7),
  ('Premium Shisha Bowl Refill', 'Empire', 550, 'Empire', 8);

-- Talent
INSERT INTO public.talent_roster (username, stage_name, talent_type, status, sort_order) VALUES
  ('kanyali', 'DJ Kanyali', 'DJ', 'Resident · Friday', 1),
  ('amina-soul', 'Amina Soul', 'Live Artist', 'Booked · May 18', 2),
  ('mc-tafari', 'MC Tafari', 'MC', 'Available', 3),
  ('lensa-frames', 'Lensa Frames', 'Photographer', 'Available', 4),
  ('khalid-decks', 'Khalid on Decks', 'DJ', 'Booked · Jun 7', 5),
  ('petra-moves', 'Petra Moves', 'Dancer', 'Available', 6);

-- Collabs
INSERT INTO public.collabs (slug, name, tagline, partner_type, featured, sort_order) VALUES
  ('kenya-cane', 'Kenya Cane', 'Official Bar Partner', 'Beverage', true, 1),
  ('lava-lab', 'Lava Lab', 'Streetwear capsule live in shop', 'Fashion', true, 2),
  ('kanyali-records', 'Kanyali Records', 'Resident sound, monthly drops', 'Music & DJs', true, 3),
  ('captain-morgan', 'Captain Morgan', 'Bottle service standard', 'Beverage', true, 4);

-- Site Events
INSERT INTO public.site_events (slug, title, event_date, tags, djs, going_count, featured, sort_order) VALUES
  ('afro-house-takeover', 'Afro House Takeover', 'Sat · Mar 15 · 22:00', ARRAY['Afro House', 'Amapiano'], 'DJ Kanyali · Special Guest', 184, true, 1),
  ('shisha-sundays', 'Shisha Sundays · Acoustic', 'Sun · Mar 16 · 18:00', ARRAY['Live', 'Acoustic'], 'Karun · Friends', 96, false, 2),
  ('summer-tides-launch', 'Summer Tides — Opening Wave', 'Fri · Apr 04 · 20:00', ARRAY['Summer Tides', 'Mixed'], 'Lineup TBA', 312, false, 3);

-- Milestones
INSERT INTO public.milestones (date_label, title, body, sort_order) VALUES
  ('Mar 2022', 'The First Night', 'A handful of friends, a single shisha, and a sound system borrowed from a cousin. The vibe was already there.', 1),
  ('Aug 2022', 'Park Hotel · USIU Road', 'We took the rooftop. We never gave it back.', 2),
  ('Dec 2022', 'First Sold-Out Saturday', 'We turned 80 people away. That was the night we knew.', 3),
  ('May 2023', 'Tusker Partnership', 'Our first major collab. The bar got bigger, the crowd got louder.', 4),
  ('Oct 2023', 'Empire Talks Launch', 'A Sunday series of intimate sets, panel chats and acoustic nights.', 5),
  ('Feb 2024', '10,000 Vibers', 'Ten thousand people through the door in a single year.', 6),
  ('Jan 2025', 'Summer Tides Announced', 'The biggest campaign in our history. Six weeks. One ocean. Coming summer 2025.', 7);

-- Recap Events
INSERT INTO public.recap_events (name, event_date, photo_count, video_count, bundle_price, sort_order) VALUES
  ('Afro House Takeover', 'May 4, 2026', 184, 22, 700, 1),
  ('Amapiano Sundays vol. 12', 'Apr 27, 2026', 96, 14, 500, 2),
  ('Big League · DJ Kanyali', 'Apr 19, 2026', 220, 31, 700, 3);
