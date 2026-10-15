-- One JPG per past-paper MCQ question, used by Question Mode.
CREATE TABLE IF NOT EXISTS public.question_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  question_number integer NOT NULL,
  storage_path text NOT NULL,
  width integer,
  height integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (paper_id, question_number)
);

CREATE INDEX IF NOT EXISTS question_images_paper_idx
  ON public.question_images (paper_id, question_number);

GRANT SELECT ON public.question_images TO anon;
GRANT SELECT ON public.question_images TO authenticated;
GRANT ALL ON public.question_images TO service_role;

ALTER TABLE public.question_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Question images are publicly readable"
  ON public.question_images
  FOR SELECT
  USING (true);