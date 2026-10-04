# Microsoft Edge Add-ons Metadata — Submission Draft

**Product:** Hub assistant  
**Publisher:** A.I MY  
**Reference build:** 8J-R2 LIVE PASS / manifest version 1.9.7  
**Status:** Candidate Partner Center copy; verify current field labels before submission.

Microsoft's current publishing flow includes a Privacy page with Single Purpose, Permission justification, Remote code, Data usage, and Privacy policy sections. All entries should remain complete, accurate, and consistent with the submitted build.

## 1. Store name

**Hub assistant**

Do not claim to be Microsoft, PowerSchool, or another organization unless authorization exists.

## 2. Short description

**Teacher-facing bilingual guidance for supported PowerSchool PowerHub workflows, with final actions kept under teacher control.**

## 3. Detailed description

Hub assistant is an independent teacher-assistance extension for supported PowerSchool / PowerHub educator pages.

It provides contextual English/Vietnamese guidance for Messages, audience selection, Group Chat guidance, Newsfeed posting reminders, language-reference guidance, walkthroughs, and quick pointers.

The extension is designed to help teachers understand the current interface and complete workflows while preserving native PowerSchool state and teacher control.

The current build:

- does not automatically perform final Send, Create Group, or Publish actions;
- does not maintain a persistent student nickname/profile database;
- does not use analytics, advertising, or telemetry;
- does not send student/guardian data to an A.I MY backend;
- limits host access to the supported PowerSchool educator site.

Current supported site:

`https://vas.educator.powerschool.com/*`

Hub assistant is independently developed by A.I MY and is not an official Microsoft or PowerSchool product.

## 4. Privacy page — Single Purpose

Suggested text:

> Hub assistant provides contextual, teacher-facing guidance on supported PowerSchool / PowerHub educator pages while keeping consequential final actions under teacher control.

## 5. Privacy page — Permission justification

### `storage`

Suggested text:

> Required to store Hub assistant preferences and guidance progress, including assistant language, walkthrough/onboarding progress, contextual-help preferences, and name-display preference. The current build does not maintain a persistent student nickname/profile database.

### Host access: `https://vas.educator.powerschool.com/*`

Suggested text:

> Required so the extension can run on the supported PowerSchool educator site, read the current interface context, show relevant teacher-facing guidance, and verify workflow state. The extension does not request access to all websites.

## 6. Privacy page — Remote code

**Answer candidate: No.**

Suggested explanation:

> The current build does not execute remotely hosted JavaScript or WebAssembly. Executable extension code is packaged with the submitted extension.

## 7. Privacy page — Data usage

Use the current Partner Center categories at the time of submission.

Describe the current behavior conservatively:

- the extension may access personal information already displayed in the supported PowerSchool educator page, such as names, roles, relationship context, class/audience context, and relevant Messages/Newsfeed interface content/state;
- this access is required for the user-facing guidance feature;
- student/guardian identity context is processed transiently in the browser;
- the current build does not maintain a persistent student nickname/profile database;
- the current build does not send student/guardian information to an A.I MY server, advertising service, or analytics provider;
- no data brokering or sale is performed;
- no behavioral advertising is performed.

Do not state that the extension accesses no personal information: the teacher-facing functionality necessarily reads personal information displayed by PowerSchool when that information is required to identify the correct workflow.

## 8. Privacy policy URL

`<TO BE PROVIDED BEFORE STORE SUBMISSION>`

Microsoft states that a privacy policy URL is required when personal information is accessed, transmitted, or collected. The policy must describe how data is collected/accessed, used, and disclosed.

### Edge-specific publishing note

Maintain one canonical data-handling policy to avoid inconsistent commitments. For the URL submitted to Microsoft Edge Add-ons, the published landing page should clearly identify the Microsoft Edge distribution and should not imply that Microsoft provides or endorses the extension.

## 9. Store listing / localization

Provide English and Vietnamese store copy if claiming both languages in the listing. Keep feature claims synchronized with the actual EN/VI extension behavior.

## 10. Reviewer test instructions

Microsoft requires the product to be testable and asks for credentials or a reasonable explanation if login is required.

Suggested submission note:

> Hub assistant operates only on https://vas.educator.powerschool.com/* and requires an authorized PowerSchool educator session for full workflow testing. Do not use production teacher credentials in certification notes. If permitted by the school/system owner, provide a dedicated sanitized reviewer account; otherwise explain why a live account cannot be shared and provide sanitized evidence/screenshots and precise test steps.

## 11. Screenshot plan

Use sanitized/synthetic content only:

1. first-run bilingual language guidance;
2. Messages guidance;
3. Group Chat guidance;
4. Newsfeed Healthy Post reminder;
5. walkthrough/quick pointers;
6. popup settings and copyright notice.

Do not expose real student, guardian, or staff personal information in store assets.

## 12. Compatibility note

The extension is Manifest V3 and Chromium-based. Store certification must still be performed independently for Microsoft Edge. Do not state that Chrome testing alone proves Edge certification.

## 13. Publisher / trademark disclosure

Recommended footer:

> Hub assistant is independently developed by A.I MY. PowerSchool and related product names are used only to identify the supported platform. This extension is not an official Microsoft or PowerSchool product.

## Official references

- Microsoft Edge Add-ons developer policies: https://learn.microsoft.com/en-us/legal/microsoft-edge/extensions/developer-policies
- Publish a Microsoft Edge extension / Privacy page: https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension
