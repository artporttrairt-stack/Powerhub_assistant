# Hub Assistant 1.9.24 Store Release Handoff

## Source baseline
- Input: `Hub_Assistant_FIX22_4_POWERTEACHER_PREREQUISITE_PRISTINE_SAVE.zip`
- User status: live-pass for now.
- Release intent: convert the live-passed FIX22.4 baseline into clean upload packages for Chrome Web Store and Microsoft Edge Add-ons without changing application behavior.

## Completed
- Preserved every pre-existing runtime file under `src/`, `sis/`, and `assets/` byte-for-byte.
- Kept Manifest V3.
- Kept functional permissions/site scope unchanged.
- Changed release metadata only:
  - `version_name` normalized from the internal candidate label to `1.9.24`.
  - `short_name` added as `Hub Assist`.
  - Added 16px and 32px icon variants derived from the existing 128px icon.
  - Registered 16/32/48/128 icons for the extension and toolbar action.
- Removed internal handoff, evidence, test, patch, changelog, and runtime-identity files from the store upload packages.
- Retained `LICENSE.txt` and `NOTICE.txt`.
- Produced separate Chrome and Edge ZIPs. Contents are intentionally equivalent because Microsoft Edge supports Chrome-compatible Manifest V3 extension APIs/manifest keys for this package and there is no Chrome-only `update_url` to remove.

## Verification performed
- Baseline regression tests from the FIX22.4 package passed before release packaging, including square pulse, walkthrough forward-lock, group information context guard, PowerTeacher prerequisite walkthrough, direct-message performance budgets, global-scan budgets, SIS liveness, Vietnamese-name merge, and FIX20 perf-probe tests.
- Store runtime source comparison: all 68 pre-existing files under `src/`, `sis/`, and `assets/` are unchanged in the Chrome release package. Edge uses the same runtime payload.
- Manifest references resolve to files in the package.
- Runtime scan found no `eval`, `new Function`, remote script injection, embedded secret, analytics endpoint, WebSocket, or externally hosted executable code.
- The one runtime `fetch()` is a same-origin PowerSchool SIS roster JSON request.

## Files to upload
- Chrome: `Hub_Assistant_1.9.24_CHROME_WEB_STORE_READY.zip`
- Edge: `Hub_Assistant_1.9.24_EDGE_ADDONS_READY.zip`

## Important remaining store-account steps
The extension ZIPs are upload-ready. Final store submission still requires account-side listing information and assets that cannot be embedded in the extension package, notably a public privacy-policy URL and real screenshots of the current live user experience. Use `STORE_SUBMISSION_CHECKLIST.md` and `STORE_LISTING_COPY.md`.

## Version caveat
This release keeps the live-tested extension `version` at `1.9.24`. Store updates require a version greater than the currently published item. If either store already contains version `1.9.24`, bump the version before upload and repeat validation.

## Final extracted-package verification
Final verification was run against the exact contents extracted from the two store ZIPs:
- Chrome static package check: **12/12 PASS**.
- Edge static package check: **12/12 PASS**.
- Regression programs on extracted Chrome payload: **13/13 exited 0**.
- Pre-existing runtime files hash-verified unchanged: **68/68**.
- Chrome and Edge store ZIPs are byte-identical by design.
- Final store ZIP SHA-256: `4f2093facce850bf3c4a1d549c2dba7daa199cbec8198027032c53a84036da27`.
