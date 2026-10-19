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

Navigation remains immediate. Selecting a navigation tile expands a visual copy
of that tile to the viewport while the live destination loads underneath. Browser
Back and explicit parent links shrink the outgoing view into the originating tile;
Browser Forward can replay an expansion. Parent scroll position is restored.
Snapshots are inert, hidden from accessibility APIs, and removed on completion,
Escape, resize, scrolling, a new interaction, or a hidden document. Embedded frames
are replaced with placeholders in copies so they cannot start duplicate loads.
Direct entries without a recorded tile use the normal page reveal.

The home atom orbits continuously. A single viewport canvas draws small bright
particles with varied trajectories and inward rebounds at each screen edge. It
sits behind content and translucent tiles, uses a capped device-pixel ratio, and
stops drawing in hidden tabs. The navigation provides a pause/resume control (in
the mobile menu on narrow screens); reduced motion suppresses ambient effects
and tile morphs. Focused learning routes dim the particle field. Navigation tiles
use a translucent tint and 7px backdrop blur (6px on mobile),
so particle halos transmit as diffused light while foreground text stays sharp.
Utility/reading cards retain denser surfaces; nested panels avoid redundant blur.

## Glass buttons, clocks, and keyboard controls

Buttons use their original glass highlights and translucent surfaces, with gentle
scale feedback on press. The raised keycap edge and persistent inset appearance
have been removed. MCQ answer selection retains its correctness colors.
Split-flap displays style real countdowns, elapsed times, study/focus timers,
classroom timers, and the India clock. Only changed characters animate; reduced
motion shows the current value immediately and suppresses decorative transforms.
The display never drives or delays timekeeping.

Across exam sheets, topic exam sheets, question mode, and topical MCQ sessions:

- **A–D** or **1–4** select an answer for the active question.
- **Left / Right arrows** move to the previous / next question.
- Space can move forward when the page itself is focused; focused buttons retain
  their native Space activation. Typing, menus, explanation dialogs, and modifier
  shortcuts retain their keys. The mobile answer drawer supports these shortcuts.

Answer sheets highlight the active row, keep it in view, and provide Previous/Next
buttons. Answers lock after selection; movement is explicit so an arrow never
accidentally skips a question following an automatic advance. Classroom quizzes
use their on-screen answer and navigation buttons; custom answer keys, arrow-key
navigation, and shortcut hints are disabled.

## Validation

- 75 unit tests pass, including edge/corner/resize and repeated particle rebounds.
- TypeScript and the production Vite build pass.
- Existing browser smoke suite passes: eight desktop routes with accessibility
  and deep-link checks, mobile navigation/layout, and mocked login, recovery,
  answer locking, and results.
- New route sweep passes 55 render/layout checks across desktop, mobile, narrow
  screens, and redirect destinations. Reduced-motion and forced-colors checks pass.
- Desktop (1440px) and mobile (390px) pixel comparisons verify that a controlled
  particle behind a tile remains visible as diffused light through its backdrop.
- The keyboard UI suite verifies answer locking, letter/number controls, arrow
  navigation, native Space behavior, button press feedback, real timer updates,
  mobile answering, focus layout, and reduced-motion clock rendering. Isolated
  classroom checks verify team selection, answers, reveal, and question review.
- The motion browser suite verifies continuous orbits, moving canvas particles,
  expansion and reverse navigation, scroll restoration, pause/reduced motion,
  320px layout, concurrent lazy loading, and interruption with Escape.
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
python3 scripts/motion-smoke.py
python3 scripts/keyboard-ui-smoke.py
python3 scripts/mcq-question-mode-smoke.py
python3 scripts/classroom-layout-smoke.py
```

The route sweep uses synthetic fixtures and intercepts every non-local request;
it never sends writes or test credentials to the backend. It requires Python
Playwright and system Chromium. Screenshots are saved under
`/tmp/browser/glass-ui`. The original smoke suite also intercepts submissions.

Live backend behavior, external font delivery, physical-device performance,
Firefox/WebKit behavior, and production field performance are not established
by these checks. Existing build warnings about large chunks remain. The licensed
font configuration is preserved; blocked font delivery uses its existing fallback.

## MCQ question mode

Past-paper tiles now open question mode directly. The PDF MCQ players and their
desktop answer panel/mobile drawer have been removed, along with the PDF switch.
Old `/exam/:paperId` links redirect with history replacement and preserve retry
parameters. Old `/topic-exam/:paperId` links resolve to the matching question-bank
topic, or the level's topic list when no exact match exists. Topic-practice cards
and counts use the question bank instead of the retired PDF sets. Theory viewers,
PDF worksheets, stored content, and historical attempts remain available.

Papers with no question images show an unavailable state with retry and return
actions. Missing images cannot accept answers or accumulate active-question
pacing; navigation remains available for retry sets. The isolated MCQ browser
suite checks desktop/mobile entry points, redirects and Back, missing content,
and preservation of theory PDF viewers.

## Classroom quiz layout

The active quiz fits the viewport: a live scoreboard stays above the question,
timer and answer controls stay on the right, and the numbered question selector
stays along the bottom. Question images scroll independently. Every team appears
together in compact cards, with no scrollbar or team selector in the answering
section. Four to six teams use two columns; smaller games use one column. The
global study timer pill is hidden on classroom routes so it cannot cover navigation;
background timers retain their state.

The classroom browser suite uses long synthetic questions and checks four screen
sizes (320–1440px), score updates, answer locking, paused review, bottom navigation,
six-team cards without scrolling, and removal of custom keyboard shortcuts. It
intercepts every non-local request.
