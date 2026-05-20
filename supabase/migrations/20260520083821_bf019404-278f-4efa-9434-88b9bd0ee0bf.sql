
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

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
