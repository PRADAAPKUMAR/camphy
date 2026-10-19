# Cloud development setup

Use the existing isolated checkout; do not create a worktree unless requested.
Run commands from the repository root. This environment was validated with
Node 24.19.0 and npm 11.9.0.

## Install and start

```sh
bash .cloud-setup/install.sh
npm run dev -- --host 0.0.0.0 --port 8080 --strictPort
```

Preserve the existing `.env`. The frontend needs `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY`; supply missing values securely in environment
settings, never in commits. Live processes must restart in future tasks.

The environment network settings need these additional destinations:

- `xnoqlggqrdwfrumibiak.supabase.co` for the existing backend
- `physicshq.lovable.app` for the application font

## Validation

```sh
npm test -- --maxWorkers=2
./node_modules/.bin/tsc --noEmit -p tsconfig.app.json
./node_modules/.bin/vite build
python3 .cloud-setup/browser-smoke-offline.py
```

The browser helper requires Python Playwright and `/usr/bin/chromium`, both
available in this cloud image. Start the Vite server first. It runs the existing
browser smoke suite with system Chromium and intercepts REST reads with empty
responses. The suite also intercepts login, password reset, and exam submissions.
It does not validate live backend connectivity. Screenshots go under `/tmp/browser`.
Do not run migrations or write to the shared backend during setup.

The project uses one canonical npm lockfile. The installer runs `npm ci` and no
longer installs an untracked compiler override. Vite and Vitest use the portable
React/Babel plugin.

The isolated test suite also replays all application migrations in in-memory
PostgreSQL. It never uses a live database. Run `npm run lint` and `npm audit` as
part of validation. See `docs/PROJECT_RECTIFICATION.md` for database deployment
steps and the regression checks for marking and cloud history.
