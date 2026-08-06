DROP POLICY "public read active tabs" ON public.nav_tabs;
CREATE POLICY "anon read active tabs" ON public.nav_tabs FOR SELECT TO anon USING (is_active);
CREATE POLICY "auth read tabs" ON public.nav_tabs FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));

DROP POLICY "public read published steps" ON public.learning_steps;
CREATE POLICY "anon read published steps" ON public.learning_steps FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "auth read steps" ON public.learning_steps FOR SELECT TO authenticated USING (status = 'published' OR public.has_role(auth.uid(),'admin'));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;