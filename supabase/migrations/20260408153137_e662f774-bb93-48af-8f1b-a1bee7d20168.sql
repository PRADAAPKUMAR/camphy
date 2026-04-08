
-- Topic-wise MCQ papers
CREATE TABLE public.topicwise_mcq_papers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  level TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 40,
  timer_minutes INTEGER NOT NULL DEFAULT 45,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.topicwise_mcq_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topicwise MCQ papers are publicly readable"
ON public.topicwise_mcq_papers FOR SELECT
TO public
USING (true);

-- Topic-wise MCQ answer keys (same q1-q40 structure)
CREATE TABLE public.topicwise_mcq_answer_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paper_id UUID NOT NULL REFERENCES public.topicwise_mcq_papers(id) ON DELETE CASCADE,
  q1 TEXT, q2 TEXT, q3 TEXT, q4 TEXT, q5 TEXT,
  q6 TEXT, q7 TEXT, q8 TEXT, q9 TEXT, q10 TEXT,
  q11 TEXT, q12 TEXT, q13 TEXT, q14 TEXT, q15 TEXT,
  q16 TEXT, q17 TEXT, q18 TEXT, q19 TEXT, q20 TEXT,
  q21 TEXT, q22 TEXT, q23 TEXT, q24 TEXT, q25 TEXT,
  q26 TEXT, q27 TEXT, q28 TEXT, q29 TEXT, q30 TEXT,
  q31 TEXT, q32 TEXT, q33 TEXT, q34 TEXT, q35 TEXT,
  q36 TEXT, q37 TEXT, q38 TEXT, q39 TEXT, q40 TEXT,
  UNIQUE(paper_id)
);

ALTER TABLE public.topicwise_mcq_answer_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can read topicwise answer keys"
ON public.topicwise_mcq_answer_keys FOR SELECT
TO service_role
USING (true);

-- Topic-wise theory questions
CREATE TABLE public.topicwise_theory_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  level TEXT NOT NULL,
  question_pdf_url TEXT NOT NULL,
  answer_pdf_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.topicwise_theory_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topicwise theory questions are publicly readable"
ON public.topicwise_theory_questions FOR SELECT
TO public
USING (true);
