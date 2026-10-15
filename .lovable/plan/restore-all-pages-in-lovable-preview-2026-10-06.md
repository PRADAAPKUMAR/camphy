# Restore all pages in Lovable Preview

## Goal
Make the app start reliably in the Lovable preview instead of showing an empty dark screen, while preserving the working published site.

## Changes
- Simplify the development startup by removing preview instrumentation that is wrapping the full React tree and producing repeated ref warnings.
- Remove custom production chunk splitting so deployments cannot serve mismatched interdependent chunks after major updates.
- Add a root-level error boundary and startup fallback so any future startup failure displays a recoverable message instead of a blank page.
- Keep all existing routes, page content, authentication behavior, and backend calls unchanged.

## Verification
- Confirm the app builds without errors.
- Open `/`, `/auth`, `/grade/igcse`, `/about`, and an unknown route in a fresh browser.
- Confirm each route renders visible content with no fatal browser errors.
