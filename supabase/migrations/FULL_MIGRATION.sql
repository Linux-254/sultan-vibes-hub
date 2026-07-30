-- =============================================
-- FULL MIGRATION (IDEMPOTENT)
-- Safe to re-run: uses IF NOT EXISTS / DO blocks
-- =============================================

-- ===== MIGRATION 1: Core schema =====

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'crew', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','crew'))
$$;

DO $$ BEGIN
  CREATE TYPE public.reservation_status AS ENUM ('pending','approved','seated','cancelled','no_show');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  party_size INT NOT NULL CHECK (party_size > 0 AND party_size <= 30),
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  table_preference TEXT,
  special_requests TEXT,
  status public.reservation_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending','success','failed','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  phone TEXT,
  mpesa_receipt TEXT,
  checkout_request_id TEXT,
  merchant_request_id TEXT,
  raw_callback JSONB,
  status public.payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS profiles_updated ON public.profiles;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
DROP TRIGGER IF EXISTS reservations_updated ON public.reservations;
CREATE TRIGGER reservations_updated BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
DROP TRIGGER IF EXISTS payments_updated ON public.payments;
CREATE TRIGGER payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, display_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), NEW.phone);

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS POLICIES (DROP IF EXISTS first to avoid duplicates)
DROP POLICY IF EXISTS profiles_self_select ON public.profiles;
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS roles_self_read ON public.user_roles;
CREATE POLICY "roles_self_read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS roles_admin_manage ON public.user_roles;
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS res_owner_or_staff_select ON public.reservations;
CREATE POLICY "res_owner_or_staff_select" ON public.reservations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS res_user_insert_own ON public.reservations;
CREATE POLICY "res_user_insert_own" ON public.reservations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS res_owner_update_pending ON public.reservations;
CREATE POLICY "res_owner_update_pending" ON public.reservations FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');
DROP POLICY IF EXISTS res_staff_update_all ON public.reservations;
CREATE POLICY "res_staff_update_all" ON public.reservations FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS res_staff_delete ON public.reservations;
CREATE POLICY "res_staff_delete" ON public.reservations FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS pay_owner_or_staff_select ON public.payments;
CREATE POLICY "pay_owner_or_staff_select" ON public.payments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS pay_user_insert_own ON public.payments;
CREATE POLICY "pay_user_insert_own" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS pay_staff_update ON public.payments;
CREATE POLICY "pay_staff_update" ON public.payments FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS chat_staff_select ON public.chat_messages;
CREATE POLICY "chat_staff_select" ON public.chat_messages FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS chat_staff_insert ON public.chat_messages;
CREATE POLICY "chat_staff_insert" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) AND user_id = auth.uid());
DROP POLICY IF EXISTS chat_owner_delete ON public.chat_messages;
CREATE POLICY "chat_owner_delete" ON public.chat_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Realtime
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS reservations_status_date_idx ON public.reservations (status, reservation_date);
CREATE INDEX IF NOT EXISTS payments_status_created_idx ON public.payments (status, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_created_idx ON public.chat_messages (created_at DESC);


-- ===== MIGRATION 2: Security hardening =====

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO authenticated;


-- ===== MIGRATION 3: Deposit column =====

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS deposit_amount numeric NOT NULL DEFAULT 500;


-- ===== MIGRATION 4: SOS incidents =====

DO $$ BEGIN
  CREATE TYPE public.sos_level AS ENUM ('YELLOW','ORANGE','RED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.sos_status AS ENUM ('open','acknowledged','resolved','false_alarm');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.sos_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  level public.sos_level NOT NULL,
  note text,
  location_lat double precision,
  location_lng double precision,
  share_location boolean NOT NULL DEFAULT false,
  status public.sos_status NOT NULL DEFAULT 'open',
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sos_incidents_status_idx ON public.sos_incidents(status, created_at DESC);
CREATE INDEX IF NOT EXISTS sos_incidents_created_idx ON public.sos_incidents(created_at DESC);

ALTER TABLE public.sos_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sos_anyone_insert ON public.sos_incidents;
CREATE POLICY sos_anyone_insert ON public.sos_incidents
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS sos_staff_select ON public.sos_incidents;
CREATE POLICY sos_staff_select ON public.sos_incidents
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS sos_staff_update ON public.sos_incidents;
CREATE POLICY sos_staff_update ON public.sos_incidents
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS sos_staff_delete ON public.sos_incidents;
CREATE POLICY sos_staff_delete ON public.sos_incidents
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS sos_incidents_set_updated_at ON public.sos_incidents;
CREATE TRIGGER sos_incidents_set_updated_at
  BEFORE UPDATE ON public.sos_incidents
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.sos_incidents REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_incidents;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ===== MIGRATION 5: Special events =====

DO $$ BEGIN
  CREATE TYPE public.event_status AS ENUM ('draft','published','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.special_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  ticket_price numeric(12,2) NOT NULL DEFAULT 0,
  event_date date NOT NULL,
  event_time time,
  countdown_enabled boolean NOT NULL DEFAULT true,
  status public.event_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.special_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "special_events_public_select" ON public.special_events;
CREATE POLICY "special_events_public_select" ON public.special_events
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "special_events_staff_all" ON public.special_events;
CREATE POLICY "special_events_staff_all" ON public.special_events
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS special_events_set_updated_at ON public.special_events;
CREATE TRIGGER special_events_set_updated_at
  BEFORE UPDATE ON public.special_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.special_events REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.special_events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
