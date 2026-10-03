# Secure accounts and profiles

## Goal
Add optional Google and email/password accounts without blocking PhysicsHQ’s existing anonymous study experience. Each account gets exactly one profile row for identity, preferences, grade, and compact usage totals; detailed learning activity remains separate and linked to that account.

## What will change
- Add sign in, registration, email confirmation, password recovery/reset, sign out, profile setup, profile/preferences, and confirmed account deletion.
- Add a navigation sign-in action and signed-in avatar menu while preserving the existing mobile and desktop layout.
- Restore a signed-in user’s saved grade and preferences without unexpectedly replacing an active route or anonymous choice.
- Offer a one-time, explicit **Merge this device’s progress** choice after sign-in; import records with stable deduplication keys.
- Protect `/admin/upload` with a verified administrator role and replace all three shared-passcode function checks with signed-in administrator validation.
- Keep all public study pages and the existing topical theory files available anonymously.

## Agreed decisions
- The requesting user’s account will become the first administrator after they register and identify the account.
- Existing device progress is merged only after the user agrees.
- Account deletion removes the account, profile, role, saved data, and linked learning history.
- Existing topical theory study files remain public; the related security alert will be documented as intentional public content rather than restricted.
