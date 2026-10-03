## Build sequence

1. **Secure identity foundation**
   - Enable managed Google and email/password sign-in with confirmation and persistent sessions.
   - Add a session provider that validates the current user and never grants privileges from browser-controlled values.
   - Add public callback, forgot-password, and reset-password routes.

2. **Profiles, roles, and activity**
   - Stage additive database changes for one profile per account, one protected role assignment per account, detailed user activity, saved favourites/items, and idempotent device-progress imports.
   - Add strict validation for account type, grade, JSON shape, timestamps, and immutable ownership.
   - Add least-privilege access rules and grants. Users can edit safe profile fields only; protected counters change through controlled server operations.
   - Automatically create the profile and normal-user role at registration.

3. **Account experience**
   - Build responsive sign-in/register, recovery/reset, first-time setup, and profile/preferences pages in the existing PhysicsHQ design.
   - Add navigation account controls, avatar fallback, sign out, and explicit destructive account deletion confirmation.
   - Preserve the intended page through sign-in and return there after the session is ready.

4. **Progress and usage synchronization**
   - Keep anonymous history working exactly as it does now.
   - Add a post-sign-in merge prompt, deterministic attempt fingerprints, idempotent import, and a clear result summary.
   - Save future signed-in attempts with detailed records while updating compact profile totals atomically from verified results.
   - Count worksheet and topical-PDF generation through authenticated, deduplicated server events; anonymous generation remains available.

5. **Administrator migration**
   - Require a verified administrator role for the admin page and every administrator operation.
   - Remove passcode fields and passcode payloads after role protection is connected.
   - Leave new accounts as normal users. Assign the first administrator only after the requesting user has registered and supplied the account identity; no account will be guessed.

## Technical safeguards
- No password or session token is stored in profile data.
- Profile role is not stored in the profile row; privileged roles remain in a separate protected table.
- Detailed history is not embedded into the profile JSON summary.
- Submission/import event IDs prevent refreshes and retries from double-counting.
- Account deletion runs server-side and removes linked personal data before deleting the identity.
- Existing public routes, instant-answer behaviour, PDFs, worksheets, and local history remain available without sign-in.

## Verification
- Test registration confirmation, Google sign-in, email sign-in, refresh persistence, sign-out, recovery, and reset.
- Test one-profile uniqueness, cross-user isolation, role escalation denial, and direct admin-route denial.
- Test merge/skip choices and repeat import to confirm no duplicate records or totals.
- Test grade restore without route overrides, profile editing, full deletion, and mobile navigation.
- Regression-test anonymous paper, question, topical, worksheet, theory-PDF, performance, and admin flows.
- Run the security and dependency checks. The public topical-theory finding will be retained as intentional because the user explicitly requires anonymous access.

## Activation note
The new database structures are staged in this draft and become active when the draft is accepted. Until then, account-dependent flows cannot be fully exercised against the live data service.
