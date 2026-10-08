# Architecture rules

- Theory topical PDFs keep original vector PDF pages and use reviewed page/topic mappings; this preserves exam quality and avoids runtime AI dependence.
- Theory question topics use a normalized many-to-many table linked to the existing syllabus topics; one question can be discovered under multiple topics without duplication.
- Optional accounts use one profile row for identity and aggregates, separate detailed activity rows, and a separate protected role row; this preserves anonymous access without weakening authorization.
- App startup uses default Vite chunking plus root-level loading and error fallbacks; this prevents preview-only failures from becoming an unexplained blank screen.
- MCQ PDFs use a MIME-verified public brand image, isolated question-image rendering with visible failure warnings, and guarded open/save fallbacks; optional assets and popup restrictions must not discard the document.