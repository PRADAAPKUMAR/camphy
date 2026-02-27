
-- Drop old answer_keys table and recreate with one row per paper, q1-q40 columns
DROP TABLE IF EXISTS answer_keys;

CREATE TABLE public.answer_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paper_id uuid NOT NULL REFERENCES papers(id),
  q1 text, q2 text, q3 text, q4 text, q5 text,
  q6 text, q7 text, q8 text, q9 text, q10 text,
  q11 text, q12 text, q13 text, q14 text, q15 text,
  q16 text, q17 text, q18 text, q19 text, q20 text,
  q21 text, q22 text, q23 text, q24 text, q25 text,
  q26 text, q27 text, q28 text, q29 text, q30 text,
  q31 text, q32 text, q33 text, q34 text, q35 text,
  q36 text, q37 text, q38 text, q39 text, q40 text,
  UNIQUE(paper_id)
);

ALTER TABLE answer_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Answer keys are publicly readable" ON answer_keys
  FOR SELECT USING (true);
