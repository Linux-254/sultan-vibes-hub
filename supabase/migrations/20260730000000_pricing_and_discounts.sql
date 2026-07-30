-- ===== PRICING CONFIG TABLE =====
CREATE TABLE IF NOT EXISTS public.pricing_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pricing_config_select ON public.pricing_config;
CREATE POLICY pricing_config_select ON public.pricing_config
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS pricing_config_staff_all ON public.pricing_config;
CREATE POLICY pricing_config_staff_all ON public.pricing_config
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS pricing_config_set_updated_at ON public.pricing_config;
CREATE TRIGGER pricing_config_set_updated_at
  BEFORE UPDATE ON public.pricing_config
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.pricing_config (key, value) VALUES
('packages', '{"solo": {"name": "Solo Vibe", "capacity": "1", "price": 700}, "duo": {"name": "Duo Pack", "capacity": "2", "price": 1200}, "squad": {"name": "Squad", "capacity": "4-6", "price": 4500}, "vip": {"name": "VIP Table", "capacity": "6-10", "price": 9000}, "sultan": {"name": "The Empire", "capacity": "10+", "price": 18000}}'),
('parking_options', '[{"id": "standard", "name": "Standard sedan", "price": 200}, {"id": "suv", "name": "SUV / crossover", "price": 350}, {"id": "premium", "name": "Premium spot (near entrance)", "price": 500}, {"id": "convoy", "name": "Convoy (3+ cars)", "price": 800}]'),
('deposit', '{"type": "percentage", "value": 30, "min_amount": 500}')
ON CONFLICT (key) DO NOTHING;

-- ===== DISCOUNTS TABLE =====
CREATE TABLE IF NOT EXISTS public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  type text NOT NULL CHECK (type IN ('percentage', 'flat')),
  value numeric(12,2) NOT NULL,
  applicable_to text NOT NULL CHECK (applicable_to IN ('all', 'product', 'event', 'reservation')),
  target_id uuid,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses int,
  used_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS discounts_select ON public.discounts;
CREATE POLICY discounts_select ON public.discounts
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS discounts_staff_all ON public.discounts;
CREATE POLICY discounts_staff_all ON public.discounts
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS discounts_set_updated_at ON public.discounts;
CREATE TRIGGER discounts_set_updated_at
  BEFORE UPDATE ON public.discounts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ===== SPECIAL EVENTS: requires_payment column =====
ALTER TABLE public.special_events ADD COLUMN IF NOT EXISTS requires_payment boolean NOT NULL DEFAULT true;
