CREATE TABLE public.theory_question_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theory_paper_id uuid NOT NULL REFERENCES public.theory_papers(id) ON DELETE CASCADE,
  question_number integer NOT NULL,
  start_page integer NOT NULL,
  end_page integer NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  shared_page_warning boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT theory_question_mappings_paper_question_key UNIQUE (theory_paper_id, question_number),
  CONSTRAINT theory_question_mappings_question_positive CHECK (question_number > 0),
  CONSTRAINT theory_question_mappings_pages_valid CHECK (start_page > 0 AND end_page >= start_page)
);
GRANT SELECT ON public.theory_question_mappings TO anon, authenticated;
GRANT ALL ON public.theory_question_mappings TO service_role;
ALTER TABLE public.theory_question_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verified theory question mappings are publicly readable"
  ON public.theory_question_mappings FOR SELECT
  USING (verified = true);
CREATE INDEX theory_question_mappings_paper_idx
  ON public.theory_question_mappings (theory_paper_id, question_number);
CREATE INDEX theory_question_mappings_verified_idx
  ON public.theory_question_mappings (verified) WHERE verified = true;
CREATE TRIGGER update_theory_question_mappings_updated_at
  BEFORE UPDATE ON public.theory_question_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.theory_question_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id uuid NOT NULL REFERENCES public.theory_question_mappings(id) ON DELETE CASCADE,
  syllabus_topic_id uuid NOT NULL REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT theory_question_topics_mapping_topic_key UNIQUE (mapping_id, syllabus_topic_id)
);
GRANT SELECT ON public.theory_question_topics TO anon, authenticated;
GRANT ALL ON public.theory_question_topics TO service_role;
ALTER TABLE public.theory_question_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topics of verified theory questions are publicly readable"
  ON public.theory_question_topics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.theory_question_mappings mapping
    WHERE mapping.id = mapping_id AND mapping.verified = true
  ));
CREATE INDEX theory_question_topics_mapping_idx ON public.theory_question_topics (mapping_id);
CREATE INDEX theory_question_topics_topic_idx ON public.theory_question_topics (syllabus_topic_id);