-- ===== 1. Fix SOS policy â€” restrict to authenticated users only =====
DROP POLICY IF EXISTS sos_anyone_insert ON public.sos_incidents;
CREATE POLICY sos_anyone_insert ON public.sos_incidents
  FOR INSERT TO authenticated
  WITH CHECK (
    level IS NOT NULL AND
    level IN ('YELLOW','ORANGE','RED') AND
    note IS NOT NULL AND length(note) <= 500
  );

-- ===== 2. Fix discounts_select â€” don't expose codes to anonymous =====
DROP POLICY IF EXISTS discounts_select ON public.discounts;
CREATE POLICY discounts_select ON public.discounts
  FOR SELECT TO authenticated
  USING (true);

-- ===== 3. Add missing roles to app_role enum =====
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'bartender';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'waitress';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'shisha_distributor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'security';

-- ===== 4. RLS for product_categories =====
ALTER TABLE IF EXISTS public.product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS product_categories_select ON public.product_categories;
CREATE POLICY product_categories_select ON public.product_categories
  FOR SELECT TO anon, authenticated
  USING (active = true OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS product_categories_staff_all ON public.product_categories;
CREATE POLICY product_categories_staff_all ON public.product_categories
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ===== 5. RLS for parking_spots =====
ALTER TABLE IF EXISTS public.parking_spots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS parking_spots_select ON public.parking_spots;
CREATE POLICY parking_spots_select ON public.parking_spots
  FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS parking_spots_staff_all ON public.parking_spots;
CREATE POLICY parking_spots_staff_all ON public.parking_spots
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ===== 6. RLS for orders =====
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS orders_self_select ON public.orders;
CREATE POLICY orders_self_select ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS orders_self_insert ON public.orders;
CREATE POLICY orders_self_insert ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS orders_staff_all ON public.orders;
CREATE POLICY orders_staff_all ON public.orders
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ===== 7. RLS for ticket_purchases =====
ALTER TABLE IF EXISTS public.ticket_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ticket_purchases_self_select ON public.ticket_purchases;
CREATE POLICY ticket_purchases_self_select ON public.ticket_purchases
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS ticket_purchases_self_insert ON public.ticket_purchases;
CREATE POLICY ticket_purchases_self_insert ON public.ticket_purchases
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ===== 8. RLS for site_content =====
ALTER TABLE IF EXISTS public.site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS site_content_select ON public.site_content;
CREATE POLICY site_content_select ON public.site_content
  FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS site_content_staff_all ON public.site_content;
CREATE POLICY site_content_staff_all ON public.site_content
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ===== 9. RLS for leads =====
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS leads_insert ON public.leads;
CREATE POLICY leads_insert ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
DROP POLICY IF EXISTS leads_staff_select ON public.leads;
CREATE POLICY leads_staff_select ON public.leads
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS leads_staff_all ON public.leads;
CREATE POLICY leads_staff_all ON public.leads
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ===== 10. RLS for faqs =====
ALTER TABLE IF EXISTS public.faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS faqs_select ON public.faqs;
CREATE POLICY faqs_select ON public.faqs
  FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS faqs_staff_all ON public.faqs;
CREATE POLICY faqs_staff_all ON public.faqs
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ===== 11. RLS for recap_media =====
ALTER TABLE IF EXISTS public.recap_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recap_media_select ON public.recap_media;
CREATE POLICY recap_media_select ON public.recap_media
  FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS recap_media_staff_all ON public.recap_media;
CREATE POLICY recap_media_staff_all ON public.recap_media
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ===== 12. RLS for site_images (slideshow) =====
ALTER TABLE IF EXISTS public.site_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS site_images_select ON public.site_images;
CREATE POLICY site_images_select ON public.site_images
  FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS site_images_staff_all ON public.site_images;
CREATE POLICY site_images_staff_all ON public.site_images
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

