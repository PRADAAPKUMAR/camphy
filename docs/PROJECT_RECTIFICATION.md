# Project consistency fixes

`codex` is the canonical codebase. `main` and `develop` receive the same validated
commit, preserving their previous history. No force push is needed when the
branches are synchronized this way.

## Fixed behaviour

- Finishing MCQ or topical practice waits for pending answer checks. A failed
  request leaves the session available for retry and saves no misleading result.
- Automatic progress sync and guest-history import use the same activity key.
- Account history is restored from authenticated, user-filtered activity reads.
  Device caches are separate for each account and for anonymous practice. Signing
  out removes account results from the active view. Clearing signed-in history
  deletes the corresponding cloud activity as well as the local cache.
- Historical syllabus migrations no longer create the same tables twice. A
  forward migration restores missing columns, conservative verification defaults,
  and the reviewed-mappings read policy. Fresh replay also defines the previously
  manual audit table before restricting access to it.
- A forward Drizzle migration consolidates identical old `local-`/`activity-`
  records and repairs account aggregates. It preserves different payloads.
- npm is the single package manager; the stale Bun lockfile was removed. Updated
  dependencies and targeted overrides remove reported audit advisories. The
  portable React compiler replaces the native SWC workaround. The UI uses
  Tailwind 4 and modern browser syntax (ES2022). Tailwind's browser baseline is
  Safari 16.4+, Chrome 111+, and Firefox 128+.
- Authored TypeScript, hooks, UI exports and backend code pass ESLint. The generated
  MCP bundle is excluded; its source modules remain linted.

## Local validation

Use Node 24 and npm 11. The working environment was checked with Node 24.19.0.

```sh
npm ci
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npm test -- --maxWorkers=2
npm run build --ignore-scripts
npm audit
```

The build flag only skips the prebuild hook that rewrites the tracked sitemap.
A normal deployment can continue using `npm run build`.

Start Vite, then run the consistency browser regression suite:

```sh
npm run dev -- --host 0.0.0.0 --port 8080 --strictPort
python3 scripts/consistency-smoke.py
```

`BROWSER_BASE_URL` can select a different local port. This suite mocks all remote
requests and covers slow marking, marking failures/retries, cloud restoration,
and logout isolation. Existing theme, keyboard and classroom-layout browser
suites also run against intercepted fixtures.

## Supabase rollout

GitHub/Vercel publication does not apply database migrations or Edge Functions.
The cloud task has no Supabase deployment token or database credentials, so the
live backend was not modified. Do not reset a live database to apply these fixes.

1. Use the project's existing authenticated Supabase workflow to inspect migration
   history and apply outstanding Supabase migrations. Fresh installations can
   replay the complete corrected history. Existing installations need the new
   `20261019000000_reconcile_syllabus_mapping.sql` forward repair; already-applied
   historical versions should stay recorded as applied.
2. Apply outstanding Drizzle migrations using the configured protected database
   connection (`LOVABLE_DB_MIGRATION_URL`). With an established Drizzle ledger,
   `npx drizzle-kit migrate` applies `0002_canonical_progress_keys.sql` once. If
   tables were originally created manually, reconcile the migration ledger with
   the existing schema before running the runner; do not recreate existing tables.
3. Deploy the updated account progress handler:
   `supabase functions deploy account-progress --project-ref xnoqlggqrdwfrumibiak`.
   This canonicalises activity keys from cached older clients too. Vite does not
   deploy this handler.
4. Verify a signed-in learner can restore history in a new browser and that
   importing an already-synced attempt does not increment totals.

The database regression runs the actual SQL against isolated PostgreSQL (PGlite),
including an idempotent duplicate-repair check. No live credentials are used.
