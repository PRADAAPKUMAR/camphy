CREATE TABLE public.theory_papers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level text NOT NULL,
  syllabus_code text NOT NULL,
  paper_code text NOT NULL,
  component text NOT NULL,
  session text NOT NULL,
  year integer NOT NULL,
  question_storage_path text,
  answer_storage_path text,
  total_questions integer NOT NULL DEFAULT 12,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (syllabus_code, session, year, component)
);

GRANT SELECT ON public.theory_papers TO anon;
GRANT SELECT ON public.theory_papers TO authenticated;
GRANT ALL ON public.theory_papers TO service_role;

ALTER TABLE public.theory_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Theory papers are publicly readable"
ON public.theory_papers FOR SELECT USING (true);

CREATE TRIGGER update_theory_papers_updated_at
BEFORE UPDATE ON public.theory_papers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.theory_explanations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theory_paper_id uuid NOT NULL REFERENCES public.theory_papers(id) ON DELETE CASCADE,
  question_number integer NOT NULL,
  part_label text NOT NULL DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  explanation text,
  image_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX theory_explanations_paper_question_idx
ON public.theory_explanations (theory_paper_id, question_number, order_index);

GRANT SELECT ON public.theory_explanations TO anon;
GRANT SELECT ON public.theory_explanations TO authenticated;
GRANT ALL ON public.theory_explanations TO service_role;

ALTER TABLE public.theory_explanations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Theory explanations are publicly readable"
ON public.theory_explanations FOR SELECT USING (true);

CREATE TRIGGER update_theory_explanations_updated_at
BEFORE UPDATE ON public.theory_explanations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();