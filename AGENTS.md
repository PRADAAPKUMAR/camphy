# Architecture rules

- Legal pages and footer links share one static policy catalog; unapproved drafts stay outside the indexable-page catalog so incomplete notices cannot be mistaken for finalized policies.

- MCQ finalisation awaits a valid mark for every answered question; pending or failed checks never become incorrect outcomes or saved zero scores. Instant feedback and finalisation share retryable requests.

- Account history uses per-user caches and one canonical activity key across automatic sync and guest import. Anonymous history requires explicit import; late account reads cannot populate another user’s cache.

- Both application migration streams must replay on isolated PostgreSQL; historical compatibility markers preserve deployed versions, while forward repairs reconcile existing data and permissions.

- PDF creators report awaited work milestones through a shared progress reporter and reusable action/HUD; percentages never advance on simulated timers, and a brief completion paint precedes the existing open/save fallback.

- Past-paper pacing accumulates visible, unanswered question visits in a shared monotonic clock, pauses for explanations, and freezes on answer/finish; PDF answer-sheet attribution is explicitly estimated because PDF reading focus cannot be measured reliably. Timing snapshots travel in existing performance payloads without schema changes.

- Past-paper grade estimates use a source-cited, reviewed static component-threshold catalog matched by syllabus, year, canonical series and exact component; missing data and partial/retry sets never receive inferred grades or qualification-level A* predictions.

- Grade presentation uses route-scoped semantic grade tokens separate from primary and scoring-state tokens; this keeps academic identity consistent without recolouring correctness feedback or global pages.

- Public search metadata and sitemap share an explicit indexable-page catalog; account, admin, redirect and exam-session URLs default to noindex to avoid accidental indexing.
- Page-specific head tags use one root Helmet provider while static HTML provides branded fallback metadata; JavaScript-free crawlers still receive the sitewide fallback until prerendering or SSR is introduced.
- Isolated Edge Function regression tests execute the actual Deno handlers with TypeScript transpilation and an in-memory client; they must never contact the shared live backend or use real credentials.

- Theory topical PDFs keep original vector PDF pages and use reviewed page/topic mappings; this preserves exam quality and avoids runtime AI dependence.
- Theory question topics use a normalized many-to-many table linked to the existing syllabus topics; one question can be discovered under multiple topics without duplication.
- Theory PDF browsing filters are separate from the ordered question basket, and topic groups resolve mapped syllabus ancestors; switching topics preserves selections across syllabus versions.
- Theory PDF question browsing scrolls inside a clipped, height-constrained region below the ordered basket; separate scroll areas prevent questions from crossing the PDF controls.
- Optional accounts use one profile row for identity and aggregates, separate detailed activity rows, and a separate protected role row; this preserves anonymous access without weakening authorization.
- Public study catalog tables use row-level read policies that permit anonymous browsing, while answer keys, profiles, roles, attempts, and user activity remain restricted; this keeps public study pages usable without exposing protected data.
- App startup uses default Vite chunking plus root-level loading and error fallbacks; this prevents preview-only failures from becoming an unexplained blank screen.
- Website typography loads the licensed single-face font through a CDN-backed CSS font-face and the semantic sans token, without synthetic bold or slant; this preserves the supplied lettering across devices while keeping monospace and PDF engine fonts separate.
- MCQ PDFs rasterize a transparent bolt-and-wordmark lockup with browser fonts and semantic print-safe theme colours, sized in points to match header text, with a built-in-font fallback, isolated question-image rendering and guarded open/save fallbacks; web fonts never enter the PDF engine and branding failures must not discard the document.