ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS deposit_amount numeric NOT NULL DEFAULT 500;