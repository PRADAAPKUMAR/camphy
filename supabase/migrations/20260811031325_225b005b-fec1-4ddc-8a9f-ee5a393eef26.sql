CREATE TABLE public.question_explanations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paper_id uuid REFERENCES public.papers(id) ON DELETE CASCADE,
  topic_paper_id uuid REFERENCES public.topicwise_mcq_papers(id) ON DELETE CASCADE,
  question_number integer NOT NULL CHECK (question_number >= 1 AND question_number <= 100),
  correct_option text,
  explanation text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT one_paper_ref CHECK (
    (paper_id IS NOT NULL AND topic_paper_id IS NULL) OR
    (paper_id IS NULL AND topic_paper_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX question_explanations_paper_q_idx
  ON public.question_explanations (paper_id, question_number)
  WHERE paper_id IS NOT NULL;

CREATE UNIQUE INDEX question_explanations_topic_q_idx
  ON public.question_explanations (topic_paper_id, question_number)
  WHERE topic_paper_id IS NOT NULL;

GRANT ALL ON public.question_explanations TO service_role;

ALTER TABLE public.question_explanations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages explanations"
  ON public.question_explanations FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_question_explanations_updated_at
  BEFORE UPDATE ON public.question_explanations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();