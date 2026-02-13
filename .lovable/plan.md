

# MCQ Exam Practice App

## Overview
A split-screen exam practice app where users browse past papers, view the PDF on the left, answer MCQs on the right, and get scored against an answer key — all with a 45-minute countdown timer.

## Pages & Flow

### 1. Home Page — Paper Browser
- A landing page with **cards** displaying available papers
- Each card shows: **subject, level, year, session, paper code**
- Cards are visually grouped or filterable by subject/level
- Clicking a card navigates to the Exam page for that paper

### 2. Exam Page — Split Screen
- **Left side (70%)**: PDF viewer showing the selected paper using `react-pdf`
- **Right side (30%)**: MCQ answer panel
  - **Timer** at the top counting down from 45 minutes
  - **40 questions** listed vertically, each with A/B/C/D buttons in a single row
  - Selected answers are highlighted
  - A **Submit** button at the bottom
  - Auto-submits when timer reaches 0

### 3. Results View
- After submission, the MCQ panel transforms to show results:
  - **Score summary** at the top (e.g., "32/40")
  - Each question shows the user's answer highlighted **green** (correct) or **red** (incorrect), with the correct answer indicated
  - Option to go back to home and try another paper

## Database (Supabase — Lovable Cloud)

### Tables
1. **papers** — `id, level, subject, year, session, paper_code, pdf_url`
2. **answer_keys** — `id, paper_id, question_number, correct_option`
3. **attempts** — `id, paper_id, score, total_questions, answers (JSON), created_at`

### Seed Data
- Mock data inserted for a few sample papers and their answer keys so the app is functional immediately

## Components
- **PaperSelector** — Card grid for browsing/selecting papers
- **PDFViewer** — Renders the PDF using `react-pdf`
- **MCQPanel** — Scrollable list of 40 questions with A/B/C/D buttons
- **Timer** — Countdown from 45:00, triggers auto-submit at 0
- **ResultSummary** — Score display with correct/incorrect highlighting

## Key Behaviors
- Timer starts when the exam page loads
- User can navigate PDF pages while answering
- Answers stored in React state during the exam
- On submit: compare with answer_keys, calculate score, save attempt to database, show results
- No authentication required — attempts are saved anonymously

