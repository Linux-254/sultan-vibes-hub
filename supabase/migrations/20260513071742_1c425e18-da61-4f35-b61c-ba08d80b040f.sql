
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'crew', 'user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','crew'))
$$;

-- Reservations
CREATE TYPE public.reservation_status AS ENUM ('pending','approved','seated','cancelled','no_show');

CREATE TABLE public.reservations (
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

-- Payments (Daraja-ready)
CREATE TYPE public.payment_status AS ENUM ('pending','success','failed','refunded');

CREATE TABLE public.payments (
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

-- Chat
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER reservations_updated BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile + bootstrap first user as admin
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========= RLS POLICIES =========

-- profiles
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- user_roles
CREATE POLICY "roles_self_read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- reservations
CREATE POLICY "res_owner_or_staff_select" ON public.reservations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "res_user_insert_own" ON public.reservations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "res_owner_update_pending" ON public.reservations FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "res_staff_update_all" ON public.reservations FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "res_staff_delete" ON public.reservations FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

-- payments
CREATE POLICY "pay_owner_or_staff_select" ON public.payments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "pay_user_insert_own" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "pay_staff_update" ON public.payments FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

-- chat_messages
CREATE POLICY "chat_staff_select" ON public.chat_messages FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "chat_staff_insert" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) AND user_id = auth.uid());
CREATE POLICY "chat_owner_delete" ON public.chat_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Realtime
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Indexes
CREATE INDEX ON public.reservations (status, reservation_date);
CREATE INDEX ON public.payments (status, created_at DESC);
CREATE INDEX ON public.chat_messages (created_at DESC);
