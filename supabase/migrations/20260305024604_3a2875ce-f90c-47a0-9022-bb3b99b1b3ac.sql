-- 1. Remove the overly permissive SELECT policy on attempts (data is never read by the app)
DROP POLICY IF EXISTS "Attempts are publicly readable" ON public.attempts;

-- 2. Add CHECK constraints for score/total_questions validation
ALTER TABLE public.attempts
  ADD CONSTRAINT attempts_score_non_negative CHECK (score >= 0),
  ADD CONSTRAINT attempts_total_questions_positive CHECK (total_questions > 0),
  ADD CONSTRAINT attempts_score_lte_total CHECK (score <= total_questions),
  ADD CONSTRAINT attempts_total_questions_max CHECK (total_questions <= 40);

-- 3. Create a validation trigger to check answers structure
CREATE OR REPLACE FUNCTION public.validate_attempt_answers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Ensure answers is a JSON object (not array, string, etc.)
  IF jsonb_typeof(NEW.answers) != 'object' THEN
    RAISE EXCEPTION 'answers must be a JSON object';
  END IF;
  
  -- Ensure paper_id references an existing paper
  IF NOT EXISTS (SELECT 1 FROM public.papers WHERE id = NEW.paper_id) THEN
    RAISE EXCEPTION 'Invalid paper_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_attempt
  BEFORE INSERT ON public.attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_attempt_answers();