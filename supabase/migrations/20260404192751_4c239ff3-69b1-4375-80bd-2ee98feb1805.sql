-- 1. Add SELECT policy on storage.objects for pastpapers bucket (public read)
CREATE POLICY "Public read for pastpapers"
ON storage.objects FOR SELECT
USING (bucket_id = 'pastpapers');

-- 2. Add SELECT policy on storage.objects for materials bucket (public read)
CREATE POLICY "Public read for materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'materials');

-- 3. Remove the permissive public INSERT policy on attempts
DROP POLICY IF EXISTS "Anyone can insert attempts" ON public.attempts;

-- 4. Remove public SELECT policy on answer_keys (no longer needed client-side)
DROP POLICY IF EXISTS "Answer keys are publicly readable" ON public.answer_keys;

-- 5. Add service-role-only SELECT on answer_keys (edge function uses service role)
CREATE POLICY "Service role can read answer keys"
ON public.answer_keys FOR SELECT
TO service_role
USING (true);

-- 6. Add service-role-only INSERT on attempts
CREATE POLICY "Service role can insert attempts"
ON public.attempts FOR INSERT
TO service_role
WITH CHECK (true);