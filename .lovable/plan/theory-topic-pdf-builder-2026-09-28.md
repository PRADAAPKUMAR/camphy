# Theory Topic PDF Builder

Prepare the existing theory-paper library for topic-based question selection while keeping every question as original PDF pages. A question may belong to several syllabus topics; it will appear under each topic and will be included only once when overlapping topics are selected.

## Student/teacher flow

- Add a **Topical PDF** action within the Theory Past Papers area for the active level.
- Show only syllabus topics that have reviewed, PDF-backed theory questions.
- Allow selecting one or more topics, then show matching questions grouped by topic and source paper.
- Let the user include/exclude individual questions and arrange the final order.
- Generate one browser-opened PDF from the selected original page ranges; do not convert pages to images.
- Number the generated selection sequentially and add source references such as the original paper and question number.
- If the same question matches several selected topics, show its topic tags but include it once in the generated PDF.

## Preparing each paper

- Add an admin mapping workspace to the existing Theory papers panel.
- For each question, record its first and last PDF page and select one or more topics from the matching Cambridge syllabus.
- Present all questions in a compact review table with mapping status, page range, and topic tags.
- Support saving the entire reviewed paper efficiently, while retaining individual corrections.
- Mark mappings as reviewed before they become available in the public topical builder.
- Show preparation coverage by paper and level so incomplete papers are easy to find.

## PDF output rules

- Copy the selected source pages at their original vector quality and dimensions.
- Keep multi-page questions together and preserve the user’s chosen question order.
- Add a generated question heading before each extracted question and sequential page numbers to the output.
- Preserve the original paper code, series, year, and source question number for traceability.
- Warn and include the complete mapped range when an exceptional shared-page mapping is recorded; never crop or silently omit content.
- Open the completed PDF in a new browser tab, matching the worksheet PDF behaviour.

## Validation and safeguards

- Exclude unreviewed mappings and papers without an available question PDF.
- Reject invalid or reversed page ranges and page numbers outside the source PDF.
- Detect duplicate source question selections and duplicate pages within one question range.
- Report unavailable PDFs, missing mappings, and failed source downloads before generation.
- Keep one question mapped to multiple topics discoverable from every topic without duplicating it in combined results.

## Technical details

- Add `theory_question_mappings` for paper/question/page-range/review state and `theory_question_topics` as a many-to-many link to existing `syllabus_topics`; both tables receive explicit grants, RLS, indexes, and uniqueness constraints.
- Public reads expose reviewed mappings only. Admin writes continue through the existing passcode-protected theory function using service-role access.
- Extend the theory admin function with mapping list/save actions and extend the public theory retrieval path with signed source-PDF URLs needed for generation.
- Add a dedicated topical theory PDF page and lazy route, reusing the current level context, syllabus hierarchy, visual design, and browser-tab PDF opening pattern.
- Use `pdf-lib`, loaded only when generation starts, to copy source pages and add generated labels/page numbers. No runtime AI service is required, so topic browsing and PDF generation do not consume Lovable AI credits.
- Topic identification for the full library is prepared as reviewed data rather than guessed live. Initial bulk mappings can be imported separately, then corrected in the admin workspace before publication.

## Verification

- Confirm a dual-tagged question such as one covering gravitational and electric fields appears in both topic lists.
- Select both of those topics and confirm the shared question is merged once.
- Generate a PDF containing single-page and multi-page questions from several source papers and verify order, quality, numbering, and references.
- Check incomplete mappings, invalid ranges, missing PDFs, shared-page warnings, mobile topic selection, and desktop administration.