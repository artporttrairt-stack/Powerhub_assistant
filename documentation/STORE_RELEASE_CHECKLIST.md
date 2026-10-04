# Hub Assistant — Chrome + Edge Store Release Checklist

**Reference build:** 8J-R2 LIVE PASS / manifest version 1.9.7  
**Publisher:** A.I MY

Use this checklist as a release gate. Do not treat the existence of this document as certification or legal approval.

## A. Freeze the candidate

- [ ] Record final ZIP filename and SHA-256.
- [ ] Confirm candidate is the exact LIVE-PASS build or an approved documentation-only repack with identical executable code.
- [ ] Run full syntax/regression/security checks on the final packaged ZIP.
- [ ] Confirm Manifest V3.
- [ ] Confirm current permissions remain only `storage` plus the exact supported host.
- [ ] Confirm no `<all_urls>`.
- [ ] Confirm no new network/analytics/telemetry code.
- [ ] Confirm no remote executable code.

## B. Reconcile manifest and store metadata

- [ ] Store name is consistent with the manifest: `Hub assistant`.
- [ ] Version is correct for the submission.
- [ ] If updating an existing Chrome listing, increment manifest `version` before upload.
- [ ] Supported site is disclosed accurately: `https://vas.educator.powerschool.com/*`.
- [ ] Single-purpose wording matches the actual extension.
- [ ] Permission justifications match the exact manifest.
- [ ] No listing copy claims features that are not in the submitted build.
- [ ] Review whether `Hub assistant — Pilot` in the popup/action title is appropriate for the intended public/internal release stage.

## C. Privacy policy publication

- [ ] Replace `<TO BE PROVIDED BEFORE STORE SUBMISSION>` contact placeholder.
- [ ] Publish `PRIVACY_POLICY.md` at a stable HTTPS URL accessible without login.
- [ ] Verify the page loads in a private/incognito browser session.
- [ ] Record the final URL in Chrome Web Store and Edge Partner Center.
- [ ] Ensure the published policy date/version is current.
- [ ] Ensure the policy says the extension locally accesses PowerSchool personal information when necessary; do not claim zero personal-data access.
- [ ] Ensure the policy states no persistent student nickname/profile database in the current build.
- [ ] Ensure the policy states no analytics/advertising/external A.I MY student-data backend in the current build.

## D. Child safeguarding / education review

- [ ] Confirm intended audience is teachers/authorized staff, not students.
- [ ] Confirm no persistent student nickname/profile feature has been reintroduced.
- [ ] Confirm teacher remains in control of final Send/Create Group/Publish actions.
- [ ] Confirm screenshots and demos use sanitized or synthetic names/content.
- [ ] Confirm no real student IDs, email addresses, messages, classes, or guardian information appear in store assets.
- [ ] Confirm school rollout/account/device-sharing model is documented separately before deployment.
- [ ] Obtain appropriate school/privacy/safeguarding review for the intended jurisdiction and rollout model.

## E. Chrome Web Store

- [ ] Publisher Google account requirements and two-step verification are complete.
- [ ] Store listing fields are complete.
- [ ] Privacy tab is complete.
- [ ] `storage` justification is accurate.
- [ ] host-access justification is accurate.
- [ ] remote-code answer is accurate.
- [ ] data-use declarations follow the current dashboard definitions.
- [ ] privacy-policy URL is entered.
- [ ] support contact/URL is entered and monitored.
- [ ] screenshots are clear, sanitized, and accurately represent the current build.
- [ ] description does not imply official PowerSchool/Google/Microsoft endorsement.

## F. Microsoft Edge Add-ons

- [ ] Single Purpose completed.
- [ ] Permission justification completed.
- [ ] Remote code declaration completed.
- [ ] Data usage section completed conservatively and accurately.
- [ ] privacy-policy URL entered and accessible.
- [ ] English/Vietnamese localization is consistent with claimed support.
- [ ] certification notes explain that full testing requires an authorized PowerSchool educator session.
- [ ] Provide a sanitized reviewer account only if authorized by the school/system owner; never submit production teacher credentials.
- [ ] listing does not imply official Microsoft/PowerSchool endorsement.

## G. Store assets

- [ ] 48px/128px icons render correctly.
- [ ] screenshots are current, readable, and not stretched.
- [ ] no confidential school information is visible.
- [ ] no third-party logos/artwork are used unless permitted.
- [ ] watermark/copyright wording is consistent with the approved A.I MY ownership notice.

## H. Final privacy/security re-scan

- [ ] No `fetch`, XMLHttpRequest, WebSocket, `sendBeacon`, analytics SDK, or telemetry endpoint was added.
- [ ] No `eval` or `new Function`.
- [ ] No cookie/history/debugger/nativeMessaging permissions.
- [ ] No new persistent student/guardian storage.
- [ ] Legacy nickname/profile cleanup remains intact unless an approved migration replaces it.
- [ ] Background message validation remains restricted to the intended extension/supported PowerSchool origin.
- [ ] Shared MutationObserver/timer model has not grown unexpectedly.

## I. Release evidence archive

Keep an internal release folder containing:

- final ZIP and SHA-256;
- static verification report;
- security/safeguarding audit;
- privacy policy version used for submission;
- Chrome metadata submitted;
- Edge metadata submitted;
- sanitized screenshots;
- certification/review notes;
- rollout decision record once the school chooses its deployment model.

## J. Re-review triggers after release

Do not reuse these disclosures unchanged if a future version adds:

- another host/site;
- a new permission;
- remote code;
- external backend/API;
- analytics or telemetry;
- Microsoft/Google identity integration;
- persistent student/guardian data;
- new automatic native actions;
- student-facing functionality.

Any of the above requires a fresh privacy, safeguarding, security, and store-metadata review.
