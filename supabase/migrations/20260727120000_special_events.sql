
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

CREATE POLICY "special_events_public_select" ON public.special_events
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

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
