
-- Create papers table
CREATE TABLE public.papers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL,
  subject TEXT NOT NULL,
  year INTEGER NOT NULL,
  session TEXT NOT NULL,
  paper_code TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create answer_keys table
CREATE TABLE public.answer_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  UNIQUE (paper_id, question_number)
);

-- Create attempts table
CREATE TABLE public.attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

-- Papers are publicly readable (no auth)
CREATE POLICY "Papers are publicly readable"
  ON public.papers FOR SELECT
  USING (true);

-- Answer keys are publicly readable
CREATE POLICY "Answer keys are publicly readable"
  ON public.answer_keys FOR SELECT
  USING (true);

-- Attempts are publicly readable and insertable (anonymous)
CREATE POLICY "Attempts are publicly readable"
  ON public.attempts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert attempts"
  ON public.attempts FOR INSERT
  WITH CHECK (true);
