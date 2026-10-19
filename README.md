# CAMPHY PHYSICSHQ

Create a React + TypeScript webapp using Vite and Tailwind.
The layout should be split screen.
Left side: PDF viewer using react-pdf component.
Right side: MCQ answer selection panel with buttons A, B, C, D.
Include timer functionality and scoring logic.
Answers should be compared with a mock JSON answer key array.
Use backend.

Have two tables:

papers (id, level, subject, year, session, paper_code, pdf_url)

answer_keys (id, paper_id, question_number, correct_option)

Layout:

Left side 70% : PDF viewer using react-pdf

Right side 30% : MCQ selection panel (display for all questions together) (40 questions)

Timer displayed at top

When a paper is selected:

Fetch PDF URL

Fetch corresponding answer keys

Allow user to:

Select A/B/C/D per question (display in a single row)

Store answers in state

Submit manually or auto-submit when timer ends (45 mins)

On submit:

Compare answers with correct_option

Show score

Highlight correct and incorrect answers

Use modular components:

PaperSelector

PDFViewer

MCQPanel

Timer

ResultSummary

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://physicshq.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d5751797-a9d8-43a8-b68b-56c35edfc521).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
