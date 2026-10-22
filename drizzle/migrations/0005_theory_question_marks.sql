ALTER TABLE public.theory_question_mappings ADD COLUMN IF NOT EXISTS marks integer;
ALTER TABLE public.theory_question_mappings ADD CONSTRAINT theory_question_marks_positive CHECK (marks IS NULL OR marks > 0);
COMMENT ON COLUMN public.theory_question_mappings.marks IS 'Per-question total marks from printed question totals or administrator review; NULL means unknown.';