# Hub Assistant — Full Release Candidate

Release stage: **Task 8L — Full Release Candidate Assembly**  
Assembly date: **2026-09-20**

## Runtime baseline

The extension runtime in this bundle is copied byte-for-byte from the user-confirmed **8J-R2 LIVE PASS** runtime.

Source runtime archive:

`Hub_Assistant_TASK8J-R2_NICKNAME_DEAD_CODE_CLEANUP_BUILD.zip`

Source SHA-256:

`4f516a607a3da6ba9c476b0c76b5f0d2b23fcc407a0d3b751ac9d8ceb86e57b8`

Task 8L does **not** change extension behavior, permissions, selectors, storage schema, runtime messages, recipient logic, Group Chat behavior, Newsfeed behavior, walkthrough behavior, language-warning behavior, or teacher-control boundaries.

## Release status

- Runtime: **8J-R2 LIVE PASS** (confirmed by product owner)
- Nickname feature: **retired**
- Persistent student nickname/profile database: **none in active runtime behavior**
- Legacy nickname/profile storage keys: retained only as targeted cleanup keys for upgrades from older versions
- Security/safeguarding static audit: included under `verification/`
- Chrome Web Store: **technical release candidate**
- Microsoft Edge Add-ons: **technical release candidate**

This bundle is **not yet public-store-final** until the publication placeholders are replaced with real organization/publisher details.

## Bundle layout

- `extension/` — extracted 8J-R2 LIVE PASS extension runtime
- `packages/Hub_Assistant_STORE_PACKAGE.zip` — store-oriented ZIP with `manifest.json` at the ZIP root
- `documentation/` — privacy policy, child safeguarding statement, permission/data map, Chrome/Edge metadata, release checklist
- `verification/` — static verification, security/safeguarding audit, removal-safety audit, and SHA-256 inventory

## Store package

`Hub_Assistant_STORE_PACKAGE.zip` contains only extension runtime files. Documentation and verification files are intentionally excluded from the store package.

The runtime files in the store package are verified byte-identical to the 8J-R2 LIVE PASS runtime. Re-zipping changes the ZIP container hash, but does not change any runtime file bytes.

## Privacy and safeguarding posture

The current release candidate is designed around data minimization:

- PowerSchool remains the source of truth.
- Student/guardian identity information required by the teacher-facing workflow is processed locally/transiently in the extension/page context.
- The retired nickname feature no longer maintains a persistent student nickname/profile database.
- No external analytics or telemetry is included.
- No A.I MY external backend is used for student/guardian data.
- Final Send, Create Group, and Publish actions remain teacher-controlled.

These statements describe the technical behavior of this release candidate and are **not a legal-compliance certification**.

## Before public store submission

Replace every publication placeholder in `documentation/` with real values, including:

- public privacy-policy URL;
- publisher/organization name if different from A.I MY;
- support/contact email or support URL;
- any school-specific deployment/contact information that is approved for publication.

Also confirm that all screenshots and promotional media use sanitized/demo data and contain no real student or staff personal information.

## Frozen runtime boundary

Do not edit the files under `extension/` as part of documentation/store submission work. Any future runtime change should start a new task/checkpoint and repeat regression/security verification.
