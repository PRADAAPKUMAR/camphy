# PhysicsHQ worksheet header customisation

## Goal
Upgrade only the generated worksheet and answer-key headers, plus the small website navigation logo. Keep question selection, multi-topic behaviour, signed images, numbering, image fidelity, and page-break rules unchanged.

## What will change
- Use the uploaded lightning artwork as the official logo in both PDFs and the website navigation.
- Add **Worksheet Name** and **Show Total Marks** controls to the existing generator settings. Marks default to on.
- Generate a contextual title when the name is blank:
  - Random: `Physics MCQ Practice Worksheet`
  - One topical selection: `{Level} Physics — {Topic} MCQ Worksheet`
  - Multiple topical selections: `{Level} Physics — Mixed Topics MCQ Worksheet`
  - Mistakes: `{Level} Physics — Mistake Revision Worksheet`
- Give the first worksheet page a compact school-paper header with brand, title, level/topic context, student fields, and optional teacher marks.
- Use a small continuation line on later worksheet pages, leaving maximum room for complete question images.
- Apply the same brand and chosen/default title to the answer key, without a student marks box.

## Preserved behaviour
Random, topical multi-select, mistakes, question count, shuffle, source traceability, answer selection, filenames, private image access, original image rendering, external numbering, A4 portrait output, and whole-question page breaks remain intact.
