# PhysicsHQ glassmorphism redesign plan

Status: implemented through the shared shell, controls, artwork, and page updates.
See [implementation and validation](GLASSMORPHISM_IMPLEMENTATION.md) for verified coverage and limitations.

## Visual direction

Create a dark, luminous physics workspace: deep ink backgrounds, softly lit frosted
panels, crisp typography, and colorful layered glass icons. Use the supplied
[Dribbble reference](https://cdn.dribbble.com/userupload/13518481/file/original-bb98d92f68cfa9841d0826401c654e81.jpg?resize=752x&vertical=center)
for icon depth, translucent overlapping forms, edge highlights, and controlled glow.
Create original PhysicsHQ symbols rather than reusing the reference's software logos.

The home page and grade dashboards carry the strongest visual expression. Paper
lists and study tools use moderate depth. Exam, reading, and admin workspaces use
dense, quiet surfaces with the same borders, corners, icons, and controls.

## Existing foundations

- React 18, Vite, Tailwind, Radix/shadcn components, and Lucide icons.
- `src/index.css` already defines glass cards, hover sweeps, and semantic colors.
- `src/App.tsx` scopes grade colors and distinguishes focused session routes.
- Existing page/tile transition hooks navigate immediately and animate afterward.
- `PhysicsBackground` already respects reduced motion; audit it alongside the
  existing home animation before adding decorative effects.
- Preserve the licensed font and its existing no-synthetic-bold/slant behavior.
- Preserve route-scoped IGCSE blue, AS orange, and A2 green. Correct, incorrect,
  selected, warning, and disabled states retain separate semantic colors.

## 1. Establish a single visual system

Starting values below are design proposals; validate contrast against actual
backgrounds before adopting them.

| Element | Proposed treatment |
| --- | --- |
| Canvas | Ink `#090E1A`, raised background `#10182A` |
| Ambient light | Restrained blue/cyan/violet radial gradients behind primary content |
| Standard panel | Dark surface at approximately 78–88% opacity; 12–16px blur |
| Reading panel | Approximately 94–98% opacity; minimal blur |
| Floating navigation/dialog | Approximately 88–94% opacity; 16–20px blur |
| Panel edge | 1px pale border with a slightly brighter upper edge |
| Corners | 12px controls, 20px panels, 24px hero panels |
| Shadows | Soft dark elevation plus restrained, contextual accent glow |
| Spacing | Consistent 4/8px scale, with generous separation around major sections |

Define semantic tokens for surface tint/opacity, blur, border, elevation, radius,
and motion. Extend current Tailwind/CSS tokens rather than introducing page-local
glass recipes. Support a solid-surface fallback with `@supports` and forced-colors
behavior. Readability must survive loss of blur or external fonts.

Use one shared decorative background per page shell. Avoid placing new ambient
animation over the existing particle canvas and atom animation simultaneously.

## 2. Build an original glass icon family

Use three visual layers: a colored rear shape, a translucent front symbol, and
a restrained rim highlight. Depth should remain recognizable without animation.

| Destination | Original symbol | Accent direction |
| --- | --- | --- |
| IGCSE | Microscope with a glass lens | Blue/cyan |
| AS | Flask with a translucent liquid layer | Orange/amber |
| A2 | Atom with overlapping orbital rings | Green/teal |
| MCQ papers | Answer sheet with marked choices | Blue/cyan |
| Theory papers | Layered document with a folded corner | Violet |
| Practice | Target with an inset glass disc | Cyan |
| Study materials | Open book with translucent pages | Pink/violet |
| Worksheet generator | Document stack with a plus symbol | Amber |
| Classroom quiz | Controller with overlapping answer tiles | Violet/cyan |
| Performance | Ascending bars with an arrow | Amber/pink |
| Study tools | Timer with a glass dial | Teal |
| Account | Profile silhouette in a frosted frame | Blue/violet |

Feature colors decorate icons; grade identity remains in grade headings, borders,
and active controls. Success colors must not become generic decoration inside
answer choices or results feedback.

Implement a reusable `GlassIcon` with named variants, sizes, and decorative versus
accessible modes. Prefer local SVG with shared gradient/filter definitions and
collision-safe IDs. Reuse Lucide for small functional controls such as close,
back, download, visibility, and sorting; these need crisp silhouettes at 16–24px.
Use richer glass illustrations around 48–72px on tiles and larger hero crests.
Validate fallback rendering and filter cost in Safari and on mobile.

## 3. Create shared components before migrating pages

Proposed components:

- `GlassSurface`: standard, reading, floating, and interactive variants.
- `GlassIcon`: the shared icon family.
- `PageBackdrop`: shared static gradients with optional limited ambient motion.
- `FeatureTile`: consistent heading, icon, description, focus, and action layout.
- `PageHeader` and `SectionHeader`: reusable title, breadcrumb, and action patterns.
- `MotionReveal`: a lightweight wrapper that respects reduced motion.

Update existing buttons, inputs, cards, tabs, dialogs, sheets, popovers, tooltips,
toasts, skeletons, and tables through their shared components. Preserve Radix
keyboard behavior, focus trapping, portal placement, and screen-reader semantics.
Provide distinguishable hover, focus, pressed, selected, loading, error, and
disabled states. Navigation tiles should retain appropriate link semantics.

Start with CSS and the Web Animations API already used by the app. Add an animation
dependency only if a demonstrated interaction cannot be maintained cleanly with
the existing tools.

## 4. Define motion as interaction feedback

| Interaction | Initial specification |
| --- | --- |
| Hover/focus | 140–180ms; small edge highlight and optional 2px lift |
| Press | 80–120ms; subtle scale around 0.98 |
| Panel entry | 220–300ms; opacity plus 6–8px translation |
| Tile stagger | 35–45ms between tiles; cap the whole group near 450ms |
| Dialog/sheet | 180–240ms; short fade/translation |
| Tabs/selection | 160–220ms; indicator transition without shifting content |
| Hero illustration | Optional slow transform/opacity movement, limited to hero |
| Results/charts | One brief entrance after real data arrives; values stay accurate |

Animate transform and opacity. Do not continuously animate blur, large shadows,
layout dimensions, or full-screen gradients. Avoid `transition-all`. Avoid
duplicating a route reveal with an independently staggered full-page entrance.

Reduced motion removes tilt, parallax, zoom, floating, sweeps, and stagger delays.
Touch uses direct press feedback; no hover-dependent content. Decorative motion
pauses when hidden or offscreen. Any automatic motion lasting more than five
seconds has an accessible pause/disable control; default to static decoration
where that control would add unnecessary complexity.

Navigation and submissions never wait for animation. PDF progress continues to
reflect awaited work milestones. Exam pacing, answer locking, and timer behavior
remain unchanged. Avoid decorative movement during active exam sessions.

## 5. Roll out across the complete website

| Wave | Pages and shared areas | Main work |
| --- | --- | --- |
| A: pilot | Home and all three grade dashboards | Establish visual direction, grade crests, feature tiles, navigation, mobile layout |
| B: discovery | MCQ paper lists, theory paper lists, topical MCQ landing/levels, topic-practice levels, materials levels, About | Shared headers, readable filters, glass list cards, original icons, empty/loading/error states |
| C: study creation | Worksheet generator, theory topical PDF builder, study tools | Glass control panels, basket, timer/timetable surfaces, progress HUD |
| D: focused learning | MCQ exams, question mode, topic exams, topical MCQ sessions, theory question/paper views, Drive viewer, classroom quiz | Quiet reading surfaces, clear answer states, minimal transitions, stable timers |
| E: account and data | Sign-in, callback, forgot/reset password, profile, performance, admin upload/tables/theory mapping | Consistent forms, charts, dialogs, dense data surfaces, validation feedback |
| F: completeness | Redirect destinations, unknown routes, fallback/loading/error shells, menus, toasts, merge prompts, running timer bar | Remove legacy styling and verify every route/state |

Retain anonymous study access and existing navigation exclusions for focused
session routes. Include grade switching and valid grade-specific destinations.
Inventory every route in `src/App.tsx` and every shared overlay; record migrated,
reviewed, and validated status for each before declaring full coverage.

PDF pages, mathematical notation, question images, and printable output keep their
existing readability and vector fidelity. Glass styling applies to viewer chrome
and controls. Exported PDFs retain print-safe colors and branding fallbacks.
Preserve the topical question basket's independent scroll behavior.

## 6. Validation and acceptance criteria

- Review pilot screenshots at 390px mobile and 1440px desktop, then validate at
  320px, 768px, and intermediate widths across representative routes.
- Check 200% zoom/reflow, keyboard-only operation, visible focus, modal focus
  return, screen-reader labels, touch targets, and reduced motion.
- Meet WCAG AA text contrast (4.5:1 body, 3:1 large text) and 3:1 essential control
  boundaries/indicators. Measure composited glass surfaces over their brightest
  and darkest backgrounds. Never use color alone to convey correctness/status.
- Aim for 44px touch targets and verify no horizontal overflow or clipped menus.
- Exercise Chromium, Firefox, and WebKit where available. Check solid fallback
  surfaces when backdrop filtering is unsupported and in forced-colors mode.
- Avoid nested blur layers. Profile mobile scrolling, open dialogs, and long
  paper lists; lower blur density where frame-time or memory suffers.
- Capture baseline and post-change measurements in the same conditions. Target
  LCP <=2.5s, INP <=200ms, CLS <=0.1 when field evidence is available; use lab
  comparisons as development evidence, not a claim of field performance.
- Preserve route-level lazy loading. Keep icon assets local and tree-shakable;
  inspect bundle changes and reject unnecessary animation/runtime dependencies.
- Run existing unit tests, TypeScript, production build, and the browser smoke
  suite with mocked backend submissions. Add focused interaction tests only for
  new shared behavior, particularly motion preferences and accessible controls.
- Verify actual study workflows: grade switching, filtering, answering/locking,
  explanations, finish/results, history, timers, worksheet selection, PDF progress,
  PDF fallback downloads, and account validation. Use fixtures or isolated mocks
  for writes. Use read-only live requests only where authorized and available.
- Record existing lint failures separately; new changes must not add failures.
  Current onboarding baseline: 65 unit tests, TypeScript, build, and isolated
  browser checks pass; lint has existing failures. Recheck the baseline when
  implementation begins.

## Delivery sequence and review points

1. **Inventory and baseline:** route/state checklist, screenshots, accessibility
   findings, performance baseline, and initial token/icon specifications.
2. **Foundation and pilot:** shared tokens/components, a representative icon set,
   Home and grade dashboards. Review desktop/mobile screenshots before expanding.
3. **Discovery and creation:** migrate waves B and C with shared components.
4. **Learning and account areas:** migrate waves D and E, verifying study behavior.
5. **Completeness and hardening:** wave F, browser/device checks, contrast/motion
   fixes, performance comparison, documentation, and a final route coverage report.

Each stage should be a reviewable change on the `codex` branch. Keep design work
separate from dependency repair, backend changes, and unrelated source cleanup.
Use shared variants so a problematic surface can be adjusted consistently. Do
not leave mixed legacy and new component styles in the final rollout.

Completion means every route family and shared state is accounted for, the icon
family is consistent, motion preferences work, study flows pass, and measured
accessibility/performance regressions have been resolved or explicitly reported.
