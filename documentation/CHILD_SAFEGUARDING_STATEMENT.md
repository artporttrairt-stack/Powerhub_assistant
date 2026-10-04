# Hub Assistant — Child Safeguarding & Student Data Statement

**Publisher / Copyright holder:** A.I MY  
**Reference build:** 8J-R2 LIVE PASS / manifest version 1.9.7  
**Date:** 20 September 2026

> This statement documents product safeguards. It is not a legal certification and does not replace school policy, safeguarding procedures, data-protection review, or jurisdiction-specific legal advice.

## Purpose and audience

Hub Assistant is designed for teachers and authorized school staff using supported PowerSchool / PowerHub educator pages. It is not designed as a student-facing application.

The extension's purpose is to provide contextual guidance while preserving teacher control and keeping PowerSchool / PowerHub as the official source of school data and workflow state.

## Safeguarding principles

### 1. Data minimization

Hub Assistant should access only the PowerSchool page information required to identify the current teacher workflow and provide the relevant guidance.

The current 8J-R2 build does not maintain a persistent student nickname/profile database.

### 2. Local and transient student-data processing

Student/guardian names, roles, relationship context, class context, and related page state may be processed transiently in the browser when needed for a teacher-facing workflow.

The current build does not send this information to an A.I MY backend, analytics service, advertising service, Microsoft Graph, Google Identity, or another cloud identity service.

### 3. No student profiling or advertising

The current build does not:

- create commercial or behavioral profiles of students;
- use student information for advertising;
- display targeted advertising;
- sell or broker student information;
- use student information for unrelated product analytics.

### 4. Teacher control

The extension may guide intermediate interface actions but does not automatically perform the final consequential teacher action for:

- sending a message;
- creating a Group Chat;
- publishing a Newsfeed post.

The teacher remains responsible for reviewing the target, content, audience, and final action.

### 5. Identity safety

Where recipient matching is used, the product design preserves native/original PowerSchool identity evidence and role matching rather than relying on approximate or nickname matching.

The removal of the former nickname feature does not remove the shared identity layer required for recipient, guardian-relation, class-mapping, and Group Chat safety checks.

### 6. Legacy nickname/profile data minimization

Older development versions used legacy nickname/profile storage. The current build includes install/update cleanup for:

- `studentNicknames`
- `studentProfiles`
- `psqmStorageVersion`

No new persistent student nickname/profile records are created by the current build.

### 7. No credential collection

The current build is not designed to collect PowerSchool passwords, browser cookies, session tokens, authentication tokens, payment data, or health data.

### 8. Minimum permissions

The current manifest requests only:

- `storage`; and
- host access to `https://vas.educator.powerschool.com/*`.

It does not request `<all_urls>`, cookies, history, webRequest, debugger, nativeMessaging, geolocation, microphone, camera, or identity-provider permissions.

### 9. Deployment-neutral safeguarding

The current design does not assume that each teacher has a separate Edge profile, Chrome profile, or device. Before rollout, the school must assess:

- whether devices or browser profiles are shared;
- who can install, remove, or configure the extension;
- whether browser management policies are used;
- how teacher authentication is managed by PowerSchool;
- how users are informed about the extension;
- how incidents and support requests are handled.

### 10. Screenshots, demos, and support material

Store screenshots, training material, bug reports, and support examples must not contain real student or staff personal information. Use sanitized or synthetic demonstration data.

### 11. Change-control safeguard

A new privacy/safeguarding review is required before releasing a version that adds any of the following:

- a new browser permission or broader host access;
- analytics or telemetry;
- an external backend or API;
- cloud sync;
- Microsoft/Google identity integration;
- persistent student/guardian data;
- automated final Send/Create/Publish behavior;
- a student-facing workflow;
- collection of new categories of personal or sensitive data.

## Vietnamese summary / Tóm tắt tiếng Việt

Hub Assistant dành cho giáo viên và nhân viên trường học được ủy quyền. Build 8J-R2 không lưu lâu dài cơ sở dữ liệu nickname/hồ sơ học sinh, không dùng analytics/ads, không gửi dữ liệu học sinh tới backend A.I MY và không tự động thực hiện hành động cuối cùng như Send, Create Group hoặc Publish. Việc rollout thực tế của trường cần được đánh giá riêng về tài khoản trình duyệt, thiết bị dùng chung, quản trị extension, user notice và quy trình safeguarding.
