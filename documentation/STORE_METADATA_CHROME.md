# Chrome Web Store Metadata — Submission Draft

**Product:** Hub assistant  
**Publisher:** A.I MY  
**Reference build:** 8J-R2 LIVE PASS / manifest version 1.9.7  
**Minimum Chrome version in manifest:** 102  
**Status:** Candidate store copy; re-check the current Chrome Web Store dashboard labels immediately before submission.

## 1. Store name

**Hub assistant**

Use the manifest/store name consistently. Do not add wording implying that the extension is an official PowerSchool, Google, Microsoft, or school-district product unless authorization exists.

## 2. Short description

**Teacher-facing bilingual guidance for supported PowerSchool PowerHub workflows, with final actions kept under teacher control.**

## 3. Detailed description

Hub assistant is an independent teacher-assistance browser extension for supported PowerSchool / PowerHub educator pages.

It provides contextual guidance for teacher workflows such as Messages, audience selection, Group Chat guidance, Newsfeed posting reminders, language-reference guidance, walkthroughs, and quick pointers.

The extension is designed to reduce unnecessary steps and help teachers understand the current PowerHub context without replacing PowerSchool as the source of truth.

Key principles:

- teacher-facing English/Vietnamese guidance;
- no automatic final Send, Create Group, or Publish action;
- native/original PowerSchool identity evidence is preserved for recipient safety;
- no persistent student nickname/profile database in the current build;
- no analytics, advertising, or telemetry in the current build;
- no external A.I MY backend for student or guardian data;
- limited host access to the supported PowerSchool educator site.

Current supported site:

`https://vas.educator.powerschool.com/*`

Hub assistant is independently developed by A.I MY and is not an official PowerSchool, Google, or Microsoft product.

## 4. Single purpose

**Provide contextual, teacher-facing guidance on supported PowerSchool / PowerHub educator pages while keeping consequential final actions under teacher control.**

Do not expand the store purpose to unrelated SIS automation, analytics, monitoring, communications services, or general web assistance unless the product and permissions are intentionally changed and re-reviewed.

## 5. Permission justification

### `storage`

Suggested dashboard text:

> Used only to save Hub assistant settings and progress, such as assistant language, walkthrough/onboarding progress, contextual-help preferences, and name-display preference. The current build does not use this permission to maintain a persistent student nickname/profile database.

Chrome documents `storage` as the permission that provides access to the extension storage API.

### Host access: `https://vas.educator.powerschool.com/*`

Suggested dashboard text:

> Required so Hub assistant can run its content script on the supported PowerSchool educator site, read the current interface context, display teacher-facing guidance, and verify the intended workflow state. Access is limited to this exact supported PowerSchool origin rather than all websites.

## 6. Remote code

**Answer candidate: No.**

Suggested explanation:

> Hub assistant does not execute remotely hosted JavaScript or WebAssembly. The current audited build contains its executable extension code within the submitted package.

## 7. Data-use / privacy-practices candidate answers

Dashboard wording and categories can change. Use the current Chrome Web Store definitions at submission time.

### Data the extension may access locally to provide the user-facing feature

Declare conservatively where the current dashboard treats local page access as a data category:

- website/page content on the supported PowerSchool educator origin;
- names and role/relationship context displayed by PowerSchool;
- Messages/Newsfeed interface content or state when required to determine the current guidance step;
- extension settings and walkthrough progress.

### Data not intentionally collected by the current build

- credentials/passwords;
- authentication cookies/tokens;
- financial information;
- health information;
- precise location;
- unrelated browsing history;
- advertising identifiers;
- student behavioral profiles.

### External transmission / sharing

Candidate declarations:

- **Sold to third parties:** No.
- **Used for advertising or ad personalization:** No.
- **Used for creditworthiness/lending:** No.
- **Transferred to an A.I MY backend:** No.
- **Third-party analytics/telemetry:** No.
- **Cloud student nickname/profile sync:** No.

Important: do not answer “no user data is accessed” if the dashboard definition includes locally read page content. The extension reads PowerSchool page information to provide its core teacher-facing feature.

## 8. Privacy policy URL

`<TO BE PROVIDED BEFORE STORE SUBMISSION>`

Publish the policy in `PRIVACY_POLICY.md` on a stable HTTPS URL that is publicly accessible without login.

## 9. Support URL / email

**Support URL:** `<TO BE PROVIDED BEFORE STORE SUBMISSION>`  
**Support email:** `<TO BE PROVIDED BEFORE STORE SUBMISSION>`

Use a monitored address appropriate for school/privacy support.

## 10. Category / audience notes

Recommended positioning: **Education / Productivity for teachers and authorized school staff.**

Do not market the extension as a student app unless safeguarding/privacy review is reopened for that use case.

## 11. Screenshot plan

Recommended screenshots:

1. bilingual first-use language guidance;
2. Messages guidance with sanitized account names;
3. Group Chat guidance with synthetic student/guardian identities;
4. Newsfeed Healthy Post reminder using demo content;
5. walkthrough/quick-pointer navigation;
6. popup settings and copyright notice.

All screenshots must use synthetic/sanitized information. Do not expose real student names, staff names, messages, classes, email addresses, IDs, or school-confidential content.

## 12. Publisher / trademark disclosure

Recommended listing footer:

> Hub assistant is independently developed by A.I MY. PowerSchool and related product names are used only to identify the supported platform. This extension is not an official PowerSchool, Google, or Microsoft product.

Have the final trademark wording reviewed before public release if the listing will use third-party logos, product marks, or screenshots.

## 13. Submission notes for reviewers

Suggested note:

> Hub assistant operates only on https://vas.educator.powerschool.com/*. It is intended for teacher-facing guidance. It requires an authorized PowerSchool educator session to demonstrate the full workflow. The extension does not automatically perform the final Send, Create Group, or Publish action. If reviewer credentials are required, provide a dedicated sanitized test account when permitted by the school/system owner; do not provide production teacher credentials.

## 14. Chrome submission checks

- Chrome Web Store requires Store listing and Privacy information before publication.
- Verify two-step verification and publisher-account requirements at submission time.
- For an update to an existing listing, confirm that the manifest `version` has been incremented before upload.

## Official references

- https://developer.chrome.com/docs/webstore/using-api
- https://developer.chrome.com/docs/extensions/reference/api/storage
- https://developer.chrome.com/docs/extensions/reference/permissions-list
