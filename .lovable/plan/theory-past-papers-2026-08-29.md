# Theory Past Papers

Add a Theory Past Papers section alongside the existing MCQ past papers, with its own levels, PDF viewer, official answer key button, per-part explanations, and an admin uploader that auto-pairs question papers with mark schemes by filename.

## Home page

Split the current "Past Papers" tile into two tiles:

- **MCQ Past Papers** -> `/papers` (existing flow, IGCSE / AS / A2 unchanged)
- **Theory Past Papers** -> `/theory-papers` (new)

## Theory browsing flow

```text
/theory-papers            -> level tiles: IGCSE, AS Level, A2 Level
/theory-papers/:level     -> paper cards (paper code, session, year)
/theory-paper/:paperId    -> question paper PDF viewer
```

On the paper viewer:
- Question paper PDF rendered full-height from Cloud storage (same Android/desktop handling as the current PDF viewer).
- **Official Answer Key** button opens the mark-scheme PDF in a new tab.
- A list of question numbers; each has an **Explanation** button that opens the same style of floating dialog used in MCQ mode. Inside the dialog, each question *part* (e.g. 1(a), 1(b)(ii)) is a card with formula-rendered text (KaTeX, as today) plus an optional image.

## Admin page

Extend the existing admin console (passcode-protected) with a **Theory papers** tile:

- Multi-file PDF upload. Filenames are parsed with the Cambridge convention:
  - `9702_s23_qp_22.pdf` -> question paper
  - `9702_s23_ms_22.pdf` -> mark scheme
  - Parsed fields: syllabus code, session letter (`s` = May/June, `w` = Oct/Nov, `m` = Feb/March), 2-digit year, component number.
  - Level is derived from the syllabus + component (0625/0972 -> IGCSE; 9702 components 1-3 -> AS; 4-5 -> A2), and is shown for override before saving.
- QP and MS with the same code/session/year/component are auto-paired into one theory paper row; uploading a MS for an existing QP fills in the missing side, and vice versa.
- Files with unrecognised names are listed as skipped with the reason, never guessed.
- An explanations editor: pick level -> paper -> question, then add/edit/delete parts (part label, explanation text supporting LaTeX, optional uploaded image).
- Existing theory papers list with delete.

## Technical notes

Database (new tables, RLS + GRANTs following project rules):
- `theory_papers`: level, syllabus_code, paper_code, component, session, year, `question_storage_path`, `answer_storage_path`, `total_questions`. Publicly readable.
- `theory_explanations`: `theory_paper_id`, `question_number`, `part_label`, `order_index`, `explanation`, `image_path`. Publicly readable (theory answers are already public via the official mark scheme, so no oracle concern as in MCQ).

Storage: new public bucket `theory-papers` holding `qp/` and `ms/` PDFs, plus `explanations/` images.

Edge function: extend the existing admin function pattern with a `admin-theory` function (passcode-verified, service role) for upload, pair, list, delete and explanation CRUD. Reads on the client go straight through the public anon client — no new read function needed.

Frontend: new pages `TheoryPapersPage`, `TheoryLevelPage`, `TheoryPaperPage`, plus `TheoryExplanationDialog` reusing `MathText`; routes registered lazily in `App.tsx` and the theory viewer added to the nav-excluded route list. Filename parsing lives in `src/lib/theory-filenames.ts` and is unit-testable.

Nothing in the existing MCQ, topic practice, performance or study-tools flows changes.
