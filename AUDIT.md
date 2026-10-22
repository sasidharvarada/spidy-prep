# Spidy ECE Prep audit

This audit records checks performed against the repository and the deployed
GitHub Pages site on 2026-10-23. It is deliberately limited to behavior that
was reproduced or verified from the source.

## Findings and changes

| Severity | Finding | Evidence | Resolution |
|---|---|---|---|
| High | `progress/main` allowed unauthenticated reads and writes. | [`firestore.rules`](./firestore.rules) contained `allow read: if true` and `allow write: if true`. | Legacy data is now readable only by authenticated users and cannot be written by the client. |
| Medium | The account dialog offered legacy import while signed out, although the new rules require authentication. | [`assets/js/app.js`](./assets/js/app.js) rendered an import button for signed-out users. | Import is now offered only after Google authentication. |
| Informational | The deployed app renders the dashboard instead of remaining on the loading screen. | Fresh navigation to the deployed root rendered dashboard content with no loading element. | No loading workaround was added. |

## Verified behavior

- The deployed dashboard rendered at `https://sasidharvarada.github.io/spidy-prep/#/`.
- The `learn`, `practice`, `lab`, `interview`, `planner`, `progress`, `about`
  and `search` routes rendered without the application error state.
- An unknown route rendered the intended not-found page.
- The account dialog rendered the signed-out state without a runtime error.
- Content, C, circuit and Verilog repository checks passed.
- Static diagnostics reported no errors.

## Not verified from this environment

- Google sign-in completion, because it requires an interactive Google account.
- Firestore writes, multi-device snapshots, offline reconnection and deployed
  rules publication.
- Firebase Console settings such as the Google provider, authorized domains,
  API restrictions and whether the rules in this repository have been published.

## Required Firebase Console action

Publish the current [`firestore.rules`](./firestore.rules) in the Firebase
console only after confirming any remaining legacy tracker writer has completed
its migration. Ensure `sasidharvarada.github.io` is an authorized domain and
Google sign-in is enabled. No service-account credentials are used by this
static client.
