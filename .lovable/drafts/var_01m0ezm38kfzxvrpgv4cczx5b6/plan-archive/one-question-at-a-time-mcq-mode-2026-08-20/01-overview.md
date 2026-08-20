# One-question-at-a-time MCQ mode

Today a past paper is a single PDF shown next to a 40-row answer sheet. This plan adds a second way to practise the same papers: one question image at a time, instant marking, explanation right there, and richer topic/subtopic performance built on the per-question data it produces.

Current data confirmed in the database: 128 papers, 3,959 verified question-to-syllabus-topic mappings, and 3,360 stored explanations. So most questions already have a topic and an explanation — what is missing is the question image and a place to store it.

## What you get

1. **Question mode** — a new button on each paper alongside the existing PDF exam. Shows one JPG per question, four option buttons, instant correct/wrong colouring, locked answer, an Explain button, prev/next, and a progress strip of all questions (green/red/unanswered) you can jump around in. Ends with a result summary that reuses the existing scoring.
2. **Admin upload page** — a protected page where you pick level / paper / question number and drop JPGs (bulk drop supported, question number read from the filename e.g. `9702_s23_12_q07.jpg`). Shows which questions of a paper still have no image, so you can see the gaps. Also lets you set or fix a question's topic/subtopic mapping and its explanation.
3. **Deeper performance** — per-question timing and attempt history, weakest-subtopic ranking, and a "retry my wrong questions" set that builds a question-mode session from your past mistakes, using the same syllabus tree already on the performance page.

Papers with no images keep working exactly as now; Question mode only appears for papers that have images.
