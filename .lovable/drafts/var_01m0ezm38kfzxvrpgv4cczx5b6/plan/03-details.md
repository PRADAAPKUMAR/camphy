## Technical details

**Storage.** Private bucket `question-images` (JPG). Path `{paper_id}/{question_number}.jpg`. Images are served through short-lived signed URLs requested per session, so the bucket stays private and URLs are not guessable.

**Schema (staged as an additive migration, applied when the draft is accepted).**
- `question_images`: `id`, `paper_id` (fk papers), `question_number`, `storage_path`, `width`, `height`, `created_at`; unique `(paper_id, question_number)`. Public `SELECT` for anon/authenticated, writes only via service role. GRANTs included.
- `attempts` gains nothing; per-question timing rides in the existing `answers` JSONB plus local performance history, matching the current anonymous model.

**Answer integrity.** Question mode never receives the full key. It calls the existing `check-answer` / `get-answer-key` edge function path already used by the exam pages, so correctness still comes from the server and the prefetch stays scoped to answered questions.

**Admin access.** The app has no auth. Options: (a) unlisted route plus a passcode checked by a new edge function against a secret, uploads done through that function with the service role; (b) add real auth for a single admin account. Recommend (a) for now — no user-facing auth added, and no service key in the browser.

**New/changed files.**
- `src/pages/QuestionModePage.tsx`, `src/components/question-mode/{QuestionCard,QuestionStrip,OptionButtons}.tsx`
- `src/pages/AdminUploadPage.tsx` + `src/components/admin/*`
- `src/hooks/use-question-images.ts`, `src/lib/question-images.ts`
- `supabase/functions/admin-upload-question/index.ts` (passcode + service-role upload + row insert), `supabase/functions/sign-question-images/index.ts`
- `src/lib/performance-history.ts`, `src/lib/topic-performance.ts` (timing, weakest-subtopic, wrong-question set), `src/components/performance/*`
- Route entries in `src/App.tsx`, entry button in the paper selector / exam page.

**Suggested build order.** 1) schema + bucket + upload page (so you can start uploading), 2) Question mode reading those images, 3) performance additions.
