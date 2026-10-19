-- Older installations created this audit table manually. Define it before
-- applying permissions so a fresh migration replay is self-contained.
CREATE TABLE IF NOT EXISTS public.question_topic_mapping_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id uuid NOT NULL,
  paper_id uuid NOT NULL,
  question_number integer NOT NULL,
  syllabus_topic_id uuid NOT NULL,
  existing_topic_code text,
  existing_topic_name text,
  audited_topic_id uuid,
  audited_topic_code text,
  audited_topic_name text,
  confidence text,
  evidence text,
  status text NOT NULL DEFAULT 'pending',
  audited_at timestamptz DEFAULT now()
);
ALTER TABLE public.question_topic_mapping_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.question_topic_mapping_audit FROM anon;
REVOKE ALL ON public.question_topic_mapping_audit FROM authenticated;
GRANT ALL ON public.question_topic_mapping_audit TO service_role;
