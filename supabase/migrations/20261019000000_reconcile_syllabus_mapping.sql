-- Reconcile installations created by either historical syllabus definition.
ALTER TABLE public.question_topic_mapping
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.question_topic_mapping ALTER COLUMN verified SET DEFAULT false;
-- PostgreSQL permissive policies combine with OR, so remove the unrestricted
-- historical policy before enforcing the reviewed-mappings boundary.
DROP POLICY IF EXISTS "Question topic mappings are publicly readable" ON public.question_topic_mapping;
DROP POLICY IF EXISTS "Verified question topic mappings are publicly readable" ON public.question_topic_mapping;
CREATE POLICY "Verified question topic mappings are publicly readable"
  ON public.question_topic_mapping FOR SELECT USING (verified = true);
DROP TRIGGER IF EXISTS update_question_topic_mapping_updated_at ON public.question_topic_mapping;
CREATE TRIGGER update_question_topic_mapping_updated_at
  BEFORE UPDATE ON public.question_topic_mapping
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
