# Task 8J-R2 Security & Child Safeguarding Audit

Date: 2026-09-20
Mode: READ-ONLY audit
Candidate: Hub_Assistant_TASK8J-R2_NICKNAME_DEAD_CODE_CLEANUP_BUILD.zip
SHA-256: 4f516a607a3da6ba9c476b0c76b5f0d2b23fcc407a0d3b751ac9d8ceb86e57b8
User status: LIVE PASS

## Executive assessment

No Critical code-security finding was found in the audited R2 package.
R2 materially reduces student-data exposure compared with the nickname-enabled architecture because it no longer persists student nickname/profile records and no longer contains nickname mutation APIs.

The remaining pre-rollout work is mainly privacy disclosure/governance, plus one optional defense-in-depth improvement for legacy-data cleanup verification.

## Fresh verification evidence

- ZIP SHA-256 matches the expected R2 candidate.
- ZIP integrity: PASS.
- JavaScript syntax: 30/30 PASS.
- Manifest V3.
- Permissions: only `storage`.
- Host permission: only `https://vas.educator.powerschool.com/*`.
- Web-accessible resources: only `assets/robot-assistant.png`, restricted to the PowerSchool host.
- R1 -> R2 manifest: byte-identical.
- R1 -> R2 background worker: byte-identical.
- R1 -> R2 changed files only:
  - `src/state/identity/identity.js`
  - `src/core/runtime/content-runtime.js`
  - `src/features/contextual-help/context-help.js`
  - `src/platform/browser/i18n.js`
- i18n key parity: 380 EN / 380 VI, exact key-set match.

## Security primitive scan

Counts in `src/**/*.js`:

- `fetch(`: 0
- `XMLHttpRequest`: 0
- `WebSocket`: 0
- `eval(`: 0
- `new Function`: 0
- `innerHTML`: 0
- `indexedDB`: 0
- `localStorage`: 0
- cookie APIs: 0
- `setInterval`: 0
- MutationObserver instances: 1 shared observer

The package contains no external executable URL, remote script source, analytics endpoint, Microsoft Graph integration, Google Identity integration, or cloud nickname synchronization.

## Persistent data review

### `chrome.storage.local`

Persistent values observed are product/settings state rather than student records:

- `uiLanguage`
- `robotLanguageIntroCompleteV1`
- `contextualHelpEnabled`
- `helpSeenContexts`
- `walkthroughEnabled`
- `nameDisplayMode`
- `messageOnboardingV1`

`messageOnboardingV1` contains workflow state such as completed steps, entry choice, guide progress and navigation progress. It does not contain student names, guardians, recipient names or PowerSchool person IDs.

### `chrome.storage.session`

The service worker stores per-tab guide progress only:

- guideId
- stepId
- status
- startedAt
- updatedAt

The message handler validates allowed fields, known guide/step values and sender origin/frame before accepting a write.

### Student and guardian information

Student/guardian identity information used by Messages and Group Chat is held in page-session memory (`Map` / `WeakMap`) and transient DOM attributes. No active path persists these records to extension storage.

## Legacy nickname retirement

R2 keeps only the retirement cleanup list:

- `studentNicknames`
- `studentProfiles`
- `psqmStorageVersion`

`chrome.runtime.onInstalled` removes exactly these three legacy keys.

Nickname storage/mutation functions are absent from the exported identity API:

- no `nicknameFor`
- no `setNickname`
- no `migrateLegacy`
- no `profiles`
- no `legacyNicknames`
- no `initializeStorage`

Shared identity functions remain available and were smoke-tested:

- `stableKey()`
- `identityKey()`
- `resolveDisplayIdentity()`

## Message security / teacher-control boundary

Programmatic native clicks still exist only in already-approved helper flows, including:

- opening New Message / navigation
- toggling Send separately
- adding/removing a verified recipient
- Group Chat pagination
- Group Chat member add
- row forwarding to the native direct-conversation target

The audit found no programmatic `.click()` on final Send, final Create Group, or Publish controls.

Recipient resolution continues to require:

- original/native recipient name evidence
- exactly one role-verified candidate
- Guardian relationship match when `contactOf` is available
- confirmation that the native recipient chip actually appears after selection
- teacher edits cancel extension ownership of the input

Fallback fragment searches do not auto-select a result; they downgrade to manual confirmation.

## Background message boundary

The service worker accepts only:

- `PSQM_GUIDE_GET`
- `PSQM_GUIDE_SAVE`

It rejects senders unless all are true:

- `sender.id === chrome.runtime.id`
- top frame (`frameId === 0`)
- integer tab ID
- exact origin `https://vas.educator.powerschool.com`

There is no `externally_connectable` manifest entry and no external-message listener.

## Session/security behavior

`session-timeout-keeper.js` validates the native timeout dialog but does not click `Stay Signed In`, install an observer, or install a listener. The audited build therefore does not silently extend a PowerSchool login session.

## DOM/XSS posture

UI rendering uses element creation and `textContent`; the scan found no `innerHTML`, `document.write`, dynamic script creation, `eval`, or `new Function`.

Manifest V3 has no custom relaxed extension-page CSP, so the browser's default extension CSP applies.

## Child safeguarding assessment

Positive controls present in R2:

1. Data minimization: nickname/profile persistence retired.
2. Purpose limitation: student/guardian identity is used for teacher-facing display and recipient/group resolution.
3. No external transmission: no network/analytics path was found.
4. No credential/cookie/token collection.
5. Teacher control over consequential final actions remains intact.
6. Fail-closed recipient matching rejects ambiguous/wrong-role candidates.
7. Unicode/native-name handling remains in the identity and recipient paths.
8. Legacy student nickname keys are explicitly targeted for deletion on extension install/update.

## Findings

### Critical

None found in this static audit.

### Important — rollout disclosure / privacy policy

The package does not contain an extension privacy notice or privacy-policy link. This is not a code exploit, but it is a rollout requirement because the extension accesses personal information and page content (for example student/guardian names and message-recipient context) even though it no longer persists those student records or sends them externally.

Before Chrome Web Store / Edge Add-ons publication, prepare accurate store disclosures and a public privacy-policy URL describing:

- what PowerSchool information the extension reads
- the teacher-facing purpose
- that student/guardian identity processing is local/transient in the audited architecture
- that no analytics/external student-data transmission exists
- what settings/progress are stored locally
- how legacy nickname data is retired
- contact / deletion / support process appropriate to the eventual school rollout

Do not claim that the extension handles no personal data.

### Moderate — legacy cleanup verification

The legacy nickname cleanup is intentionally exact-key and low-risk, but it currently runs in `runtime.onInstalled` and suppresses removal errors with `.catch(() => {})`.

For store updates this is the normal migration point. For strongest child-data minimization across unusual sideload/reload/deployment paths, a later hardening task could make cleanup idempotent and verifiable without introducing new permissions or student storage. This is not required to preserve R2's current live behavior, so it should be handled as a separate bounded task if approved.

### Minor — transient DOM identity metadata

The content runtime mirrors native names/person evidence into `data-psqm-*` attributes while the PowerSchool page is active. These values are not persisted or transmitted, and the same-origin PowerSchool page already contains the underlying identity data. Keep this only while required by shared identity/recipient contracts; do not expand it into persistent storage.

### Release-readiness note

The manifest still reports version `1.9.7`. Before submitting R2 as an update through a browser store, use the release/versioning process required by that store. This is not a security defect.

## Recommendation

Treat R2 as the current LIVE-verified functional base.

Do not reopen Messages/Group Chat or nickname architecture as part of privacy-policy work.

Next safest work item before external rollout:

**Privacy & Child Safeguarding Disclosure Pack**

Documentation/store-metadata work first; no functional code change required.

Optional separate hardening after that:

**Legacy Student Data Cleanup Verification**

Only if approved, with regression locks against the R2 LIVE-PASS build.

## Limitation

This is a static package/code audit plus user-confirmed live behavior. It is not a legal compliance certification, penetration test, browser-store certification, or review of the school's final deployment/consent process. Those depend on the eventual rollout model and jurisdictional obligations.
