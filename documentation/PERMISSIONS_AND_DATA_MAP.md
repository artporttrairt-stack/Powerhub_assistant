# Hub Assistant — Permissions & Data Map

**Reference build:** 8J-R2 LIVE PASS / manifest version 1.9.7  
**Date:** 20 September 2026

This file is an internal release/audit aid. It maps the current manifest and audited data flows to store disclosure language.

## 1. Manifest permission map

| Capability | Current build | Purpose | Personal-data impact | Store disclosure |
|---|---|---|---|---|
| `storage` | Yes | Save extension preferences and guidance progress | May store teacher-facing settings/progress; not intended for persistent student profiles | Justify explicitly |
| `https://vas.educator.powerschool.com/*` | Yes | Run guidance on supported educator site | Allows local access to page content needed for guidance | Justify explicitly |
| `<all_urls>` | No | Not required | Avoids broad cross-site access | No claim needed beyond minimal-access description |
| cookies | No | Not required | Extension does not request cookie access | Do not imply cookie collection |
| history | No | Not required | No unrelated browsing-history permission | Do not claim web-history collection |
| identity / OAuth | No | Not required | No Microsoft/Google identity integration | No identity-provider disclosure |
| analytics / telemetry permission | No | None | No analytics/telemetry service in current build | State no analytics/telemetry |
| IndexedDB student vault | No | Not present | No persistent student nickname/profile database | State data minimization |

## 2. Current data lifecycle

### A. PowerSchool page data

Examples:

- names and native account identity evidence;
- student/guardian roles;
- guardian/student relation context;
- class/audience context;
- Messages/Newsfeed interface state/content when needed for guidance;
- native recipient-chip state;
- language/locale interface state.

Lifecycle:

`PowerSchool DOM -> in-memory page/runtime processing -> teacher-facing guidance`

Current disposition:

- no persistent student nickname/profile database;
- no A.I MY backend transmission;
- no analytics/advertising transmission.

### B. Extension settings/progress

Examples:

- assistant language/reference preference;
- walkthrough/onboarding progress;
- contextual-help preference;
- name-display preference;
- related extension state.

Lifecycle:

`Teacher action / extension state -> chrome.storage.local -> reused by extension`

Purpose:

Continue the user's extension experience across supported sessions/pages.

### C. Legacy nickname/profile keys

Keys:

- `studentNicknames`
- `studentProfiles`
- `psqmStorageVersion`

Lifecycle in current build:

`legacy browser storage -> install/update cleanup -> removed when cleanup succeeds`

Current build does not create new persistent records under these legacy keys.

## 3. External transmission map

| Destination | Current build behavior |
|---|---|
| A.I MY backend | None |
| Third-party analytics | None |
| Advertising network | None |
| Microsoft Graph | None |
| Google Identity | None |
| Cloud nickname/profile store | None |
| PowerSchool | Normal website traffic is handled by the PowerSchool service itself; Hub Assistant does not add its own student-data backend transmission |

## 4. Teacher-control map

| Action | Extension may guide intermediate steps | Extension performs final action automatically |
|---|---:|---:|
| Select/resolve recipient | Yes, within existing guarded behavior | No final message send |
| Group Chat workflow | Yes, within existing guarded behavior | No final Create Group |
| Newsfeed workflow | Yes | No final Publish |
| Language guidance | Yes | Does not change native PowerSchool language setting automatically |

## 5. Student-data minimization boundary

Preserve:

- `stableKey()` / `identityKey()` and related native identity evidence needed for safe matching;
- guardian/student relation matching;
- class mapping;
- role verification;
- native recipient-chip verification.

Do not reintroduce without a new privacy review:

- persistent student nickname/profile database;
- fuzzy/approximate recipient auto-selection;
- external student-data transmission;
- analytics tied to student/guardian identity;
- cloud sync of student/guardian identity data.

## 6. Store-disclosure rule

Do not confuse **local access** with **no data access**.

Accurate wording:

> The extension accesses PowerSchool page information locally when needed to provide teacher-facing guidance and does not send that information to an A.I MY backend or analytics service in the current build.

Avoid:

> The extension does not access personal information.

That statement would be inconsistent with the actual content-script behavior.

## 7. Change triggers requiring a new review

Reopen this map and the Privacy Policy before releasing any version that adds:

- new manifest permissions;
- broader hosts;
- remote code;
- analytics/telemetry;
- cloud/backend services;
- identity-provider APIs;
- persistent student/guardian data;
- automatic final actions;
- student-facing workflows.
