# Glass UI implementation

The website now uses a shared dark glass design system. `src/glass.css` defines
surface materials, backdrop lighting, local layered icon styling, motion,
mobile rendering, reduced-motion behavior, solid fallbacks, and forced colors.
`GlassIcon` combines Lucide symbols with original translucent layered artwork.
No new packages or hosted icon assets are required.

## Coverage

| Area | Applied treatment |
| --- | --- |
| Home and IGCSE/AS/A2 dashboards | Layered grade/feature artwork, luminous backdrop, glass tiles, revised hero and hover feedback |
| Paper lists, materials, topic browsing | Shared page headers, glass cards, tabs, filters, and feature artwork |
| Worksheets and theory topical PDF builder | Glass controls and topic browser, independent selection basket and question scrolling |
| Study tools | Shared panel, timer artwork, selected-control semantics, existing timer/timetable content |
| Exams, question mode, topical sessions, theory/Drive viewers, classroom quiz | Quiet glass chrome and stable reading surfaces; original scoring and timing behavior retained |
| Authentication, recovery, profile | Glass forms, account artwork, shared inputs/buttons/dialogs |
| Performance and administration | Shared cards, controls, tables, popovers, and management artwork |
| Shared states | Navigation, menus, sheets/drawers, dialogs, tooltips, toasts, loading/error surfaces, 404, running timer bar |

Every route inherits the shared shell/materials, including redirects and gated
pages. Rich glass icons are used for feature destinations and headings; small
functional icons retain crisp Lucide silhouettes.

IGCSE/AS/A2 identity stays separate from correct/incorrect feedback. Original
question images, embedded documents, mathematical notation, generated PDFs,
progress milestones, account permissions, data access, and grading are retained.

## Motion and rendering

Navigation remains immediate. Page entrances, hover/press feedback, icon layers,
and overlays provide motion without gating input. The home orbit runs once;
background particles were replaced with a static light field to avoid continuous
canvas work. Focused learning routes suppress decorative route movement. Reduced
motion removes decorative transforms and transitions. Mobile cards use denser
surfaces without backdrop blur. Nested panels avoid redundant blur.

## Validation

- 65 existing unit tests pass.
- TypeScript and the production Vite build pass.
- Existing browser smoke suite passes: eight desktop routes with accessibility
  and deep-link checks, mobile navigation/layout, and mocked login, recovery,
  answer locking, and results.
- New route sweep passes 55 render/layout checks across desktop, mobile, narrow
  screens, and redirect destinations. Reduced-motion and forced-colors checks pass.
- Additional isolated checks cover signed-in profile, admin dashboard, theory
  management, and profile confirmation-dialog keyboard/focus behavior.
- Full lint remains at its existing baseline: 51 errors and 20 warnings. Targeted
  lint passes for the new artwork, background, dashboard/home/study-tools changes,
  and route-transition hook.

Run the dev server on port 8080, then run:

```sh
npm test -- --maxWorkers=2
./node_modules/.bin/tsc --noEmit -p tsconfig.app.json
./node_modules/.bin/vite build
python3 .cloud-setup/browser-smoke-offline.py
python3 scripts/glass-ui-smoke.py
```

The route sweep uses synthetic fixtures and intercepts every non-local request;
it never sends writes or test credentials to the backend. It requires Python
Playwright and system Chromium. Screenshots are saved under
`/tmp/browser/glass-ui`. The original smoke suite also intercepts submissions.

Live backend behavior, external font delivery, physical-device performance,
Firefox/WebKit behavior, and production field performance are not established
by these checks. Existing build warnings about large chunks remain. The licensed
font configuration is preserved; blocked font delivery uses its existing fallback.
