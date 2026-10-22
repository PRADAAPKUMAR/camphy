CREATE TABLE public.theory_question_part_marks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 theory_paper_id uuid NOT NULL REFERENCES public.theory_papers(id) ON DELETE CASCADE,
 question_number integer NOT NULL CHECK (question_number > 0),
 part_label text NOT NULL,
 order_index integer NOT NULL CHECK (order_index > 0),
 marks integer NOT NULL CHECK (marks > 0),
 source_file text NOT NULL,
 source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[0-9a-f]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (theory_paper_id, question_number, part_label),
 UNIQUE (theory_paper_id, question_number, order_index)
);
GRANT SELECT ON public.theory_question_part_marks TO authenticated;
GRANT ALL ON public.theory_question_part_marks TO service_role;
ALTER TABLE public.theory_question_part_marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can read theory subdivision marks" ON public.theory_question_part_marks FOR SELECT TO authenticated USING (true);
COMMENT ON TABLE public.theory_question_part_marks IS 'Explicit subdivision marks extracted from reviewed uploads. Empty part_label denotes an unsubdivided question. Source filename and SHA256 preserve provenance; existing explanations and mappings are not rewritten.';