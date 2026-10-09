# Grade-first navigation

- [x] Rename every user-facing A2 label to A Level while preserving existing content links
- [x] Match the home-page atom motion shown in the supplied recording
- [x] Restore AS Level MCQ past papers using the available content label
- [x] Remove MCQ Past Papers from A Level navigation and dashboard
- [x] Map each grade to its available Practice and Study Materials content
- [x] Merge the navigation logo into the navigation background
- [x] Restore a visible atom animation on the grade-selection page
- [x] Add canonical grade model and persistent grade context
- [x] Replace home with grade selector and add grade dashboards
- [x] Add grade-aware header navigation and switcher
- [x] Scope worksheet and performance to active grade
- [x] Update breadcrumbs, back links, detail synchronization, and prefetch routes
- [x] Verify builds and grade navigation flows
- [x] Show the IGCSE mapped topical MCQ bank from its Practice page
- [x] Match AS Level theory papers regardless of label capitalization
- [x] Make the navigation three-dot options reliably clickable

# Classroom team quiz

- [x] Add an IGCSE/AS-only quiz entry and routes
- [x] Build random/topical setup with 2–6 teams and question timer
- [x] Build teacher-recorded locked answers, speed scoring, and automatic reveal
- [x] Build live leaderboard and final results board
- [x] Verify random/topical gameplay and grade restrictions

# Classroom quiz controls

- [x] Show explanations only after each question is revealed
- [x] Add confirmed early quiz completion and show current results
- [x] Verify both classroom quiz controls

# Theory topical PDF preparation

- [x] Retain selected questions across topic changes and additive select-all
- [x] Add main-topic list and mapped subtopic dropdown, with questions on the right
- [x] Position and rename PDF creation action and verify selection flow

- [x] Store reviewed question page ranges and multiple syllabus topics per question
- [x] Add admin mapping and review controls for every theory paper
- [x] Add topic-based theory question selection across papers
- [x] Merge selected original PDF pages into a newly ordered PDF
- [x] Add sequential generated question labels, page numbers, and source references
- [x] Validate missing mappings, unavailable PDFs, duplicates, and rare shared pages
- [x] Verify multi-topic questions appear under every mapped topic but merge only once

# Secure accounts and profiles

- [x] Stage one-row profiles, protected roles, and detailed activity storage
- [x] Add email/Google account interface, recovery, profile setup, and deletion
- [x] Keep anonymous study and add optional deduplicated progress merging
- [x] Replace shared administrator passcode checks with verified roles
- [ ] Activate staged account structures and auth providers when the draft is accepted
- [ ] Assign the requesting user's registered account as first administrator
- [ ] Run authenticated end-to-end tests after activation

# Preview startup reliability

- [x] Remove preview-only component instrumentation and custom chunk splitting
- [x] Add visible startup and render failure fallbacks
- [x] Verify all primary routes in a fresh preview session

# MCQ PDF reliability

- [ ] Match worksheet and answer-key wordmarks to the homepage and verify PDF generation

- [x] Validate the logo response and keep decorative image failures nonfatal
- [x] Guard PDF opening with link/save fallbacks and isolate question image failures
- [x] Show actionable PDF errors and warn about incomplete question images
- [x] Verify regression tests and both PDF actions for IGCSE and AS
