# Architecture rules

- Public search metadata and sitemap share an explicit indexable-page catalog; account, admin, redirect and exam-session URLs default to noindex to avoid accidental indexing.
- Page-specific head tags use one root Helmet provider while static HTML provides branded fallback metadata; JavaScript-free crawlers still receive the sitewide fallback until prerendering or SSR is introduced.

- Theory topical PDFs keep original vector PDF pages and use reviewed page/topic mappings; this preserves exam quality and avoids runtime AI dependence.
- Theory question topics use a normalized many-to-many table linked to the existing syllabus topics; one question can be discovered under multiple topics without duplication.
- Theory PDF browsing filters are separate from the ordered question basket, and topic groups resolve mapped syllabus ancestors; switching topics preserves selections across syllabus versions.
- Theory PDF question browsing scrolls inside a clipped, height-constrained region below the ordered basket; separate scroll areas prevent questions from crossing the PDF controls.
- Optional accounts use one profile row for identity and aggregates, separate detailed activity rows, and a separate protected role row; this preserves anonymous access without weakening authorization.
- App startup uses default Vite chunking plus root-level loading and error fallbacks; this prevents preview-only failures from becoming an unexplained blank screen.
- MCQ PDFs rasterize a transparent bolt-and-wordmark lockup with browser fonts and semantic print-safe theme colours, sized in points to match header text, with a built-in-font fallback, isolated question-image rendering and guarded open/save fallbacks; web fonts never enter the PDF engine and branding failures must not discard the document.