ALTER TABLE public.question_topic_mapping_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.question_topic_mapping_audit FROM anon;
REVOKE ALL ON public.question_topic_mapping_audit FROM authenticated;
GRANT ALL ON public.question_topic_mapping_audit TO service_role;