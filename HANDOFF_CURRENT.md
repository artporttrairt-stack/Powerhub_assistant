# GitHub baseline sync — Hub Assistant Expanded 1.9.24

Date: 2026-10-04 (Asia/Ho_Chi_Minh)
Branch: `sync/baseline-1.9.24-20261004`
Base commit: `a2b698d003bcb88a7cca3d0bebfaed4172ff69a1` (main, initial commit, 2026-09-12).
Scope: one synchronization commit on a separate branch. Main is not merged by this task.

## Completed and exact source

Imported all 74 files byte-for-byte from the latest uploaded Chromium 1.9.24 package:
`Hub_Assistant_1.9.24_EDGE_ADDONS_TEXT_ONLY_CERT_READY.zip`.
SHA-256: `7da8fcf2a79ac1ac02166fc54f4edfc38ddb1759466ffac45791e7df979048c8`.
Library source ID and upload timestamp are recorded in `docs/baseline-1.9.24/SYNC_INVENTORY.json`.

The latest dated `FULL_RELEASE_BUNDLE(2)` is internally 1.9.7; it was excluded.
The later PHASE0 smoke-test package and PHASE1/standalone DEV builds were excluded.
Firefox FIX142 is a browser-specific derivative and was not used for this Chromium baseline.

The selected package has exactly four upstream differences from the passed Chrome/Edge store payload
(store ZIP SHA-256 `4f2093facce850bf3c4a1d549c2dba7daa199cbec8198027032c53a84036da27`):
LICENSE.txt, NOTICE.txt, popup.html's visible version/use notice, and i18n.js's two use-notice strings.
These upstream changes were imported as supplied. No further edits were made to any package file.
All other package files match the original store release. Of 68 pre-existing FIX22.4 files, 66 remain byte-identical;
the two differences are those popup/i18n text changes. Manifest behavior and algorithms are unchanged from the store release.

## What was outdated on main

| Old path | Action / current replacement |
| --- | --- |
| manifest.json | Replace 1.8.13 manifest with exact 1.9.24 manifest |
| background.js | Remove; current service worker is src/background/background.js |
| content.js | Remove; current content scripts are the manifest-ordered src/ and sis/ modules |
| styles.css | Remove; current CSS paths are in manifest content_scripts |
| popup.html, popup.js, popup.css | Remove; current popup is src/popup/ |
| icon48.png, icon128.png | Remove; current icons are assets/icons/ |
| README.md | Replace stale 1.8.13 instructions; retain historical copy |

All 73 non-manifest package paths were absent on main. Full path-level hashes, additions, replacements,
deletions and retained historical paths are in SYNC_INVENTORY.json. Historical inspection files and utilities
remain unchanged; their observations concern the older code. No unrelated refactor, permission edit,
selector edit, observer/scheduler change or new dependency is included.
AGENTS.md and three existing Node regression suites were copied from the FIX22.4 source archive.

## Verification and evidence limits

Current verification: 74/74 package files byte-identical to selected archive; manifest references resolve;
51 JavaScript files parse with node --check; FIX20 perf probe, SIS liveness/performance, and Vietnamese-name
regression suites pass. Detailed current results: docs/baseline-1.9.24/SYNC_VERIFICATION.json.
Use `python3 handoff/verify_baseline.py` to repeat these checks, including obsolete-root-file absence.

The source FIX22.4 handoff originally said candidate/live-test-required. The later release handoff states
"User status: live-pass for now" and records 13/13 regression programs plus 68/68 runtime parity.
The later handoff is evidence of the reported release status; it is not a new live test by this sync task.
Original release evidence is copied unchanged under docs/baseline-1.9.24.
Python Playwright is unavailable here, so browser fixture suites and authenticated PowerSchool flows
were not rerun. No claim of a new complete browser/live PASS is made.

## Continue safely

1. Checkout this branch/commit and run the baseline verifier before editing.
2. Treat this exact payload as the development starting point; create a separate feature branch.
3. Preserve manifest script order, square Directory overlay pulse, walkthrough forward lock,
   native teacher-controlled Save/Send/Create/Publish boundaries, RAM-only student identity handling,
   SIS liveness, and observer/performance behavior.
4. Repeat affected regression checks and authenticated browser checks for any runtime change.
5. Before merging this sync to main, review the inventory and smoke-test the installed payload in
   authorized PowerHub/SIS/PowerTeacher sessions. No merge or store publication occurred here.

Entry points: manifest.json; src/core/bootstrap/content.js; src/core/runtime/content-runtime.js;
src/features/message-person-find-recovery/; sis/src/content.js; sis/src/powerteacher-standalone-bootstrap.js;
sis/src/powerteacher-native-prerequisite-verifier.js; src/popup/.

## Version and integrity

Version: 1.9.24; version_name: 1.9.24. Future store updates require an appropriate greater version.
RUNTIME_SHA256SUMS.txt covers all supplied package members, including license/notice/assets.
SYNC_INVENTORY.json also contains Git blob SHAs for remote verification.
.gitattributes disables line-ending conversion on exact package paths, so Windows checkouts preserve hashes.

## Rollback

Before merge, return to `main` or the base commit in a separate clean checkout; the sync is isolated.
After a normal merge, use `git revert <sync-commit-sha>` on a new rollback branch; after a merge commit,
use `git revert -m 1 <merge-commit-sha>`. Obtain the actual SHA from GitHub history; do not force-push main.
This restores repository state to the prior 1.8.13 snapshot, not the preferred runtime rollback.
For runtime rollback to the passed 1.9.24 payload, reinstall the original Chrome/Edge store ZIP with
SHA-256 `4f2093facce850bf3c4a1d549c2dba7daa199cbec8198027032c53a84036da27`.
FIX19 remains the older live-pass recovery checkpoint referenced by the source handoff, but was not
used for this synchronization. Repository revert does not roll back browser extension storage.
