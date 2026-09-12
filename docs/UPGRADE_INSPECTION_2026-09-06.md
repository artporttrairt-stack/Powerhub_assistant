# PowerHub Assistant upgrade inspection

Inspected on 2026-09-06 (Asia/Saigon). Scope: inspect the supplied v1.8.13 extension, read the complete pasted upgrade specification, and inspect the available authenticated PowerSchool UI. No extension implementation or release was performed.

## Baseline

- Folder: `D:\Powerhub_assistant`.
- Manifest version: **1.8.13**, MV3; minimum Chrome version 102.
- Ten root files: `manifest.json`, `background.js`, `content.js`, `popup.html`, `popup.js`, `popup.css`, `styles.css`, `README.md`, `icon48.png`, `icon128.png`. Icons are in the root, rather than an `icons/` directory.
- `content.js` is 2,341 lines. No test suite, package configuration, bundler, or Git repository was present.
- Permissions: `notifications`, `storage`; one host: `https://vas.educator.powerschool.com/*`.
- The six proposed identity/help/guide files are not present.
- Existing product behavior is concentrated in the content-script IIFE. The service worker handles notifications, badges, and monitor-tab selection; the popup handles the notification toggle and legacy nickname count.

Baseline SHA-256:

| File | SHA-256 |
| --- | --- |
| manifest.json | BF0A1CF64007EE8A372910ED92D4A3297461B5B54B3A8AD0B4BFE38437DDE0CF |
| content.js | 53757178378615146856F41BE0FE7E572A4B7C3268EAEF75371B854B5E814A57 |
| background.js | DABD79410DE2AB61B64325074D58A226D434DBD11EF20888FC4A030B9466FB87 |
| popup.js | 72CCE2034633F2161E521B2A62D979ADB45FDA7FC398ABEBFD28E8ABE9DD2261 |

## Findings that affect the upgrade

### 1. Recipient selection is less strict than the specification assumes

This is the first dependency to fix before claiming that the pilot preserves a safe Quick Message baseline.

- `content.js:158`: `nameMatchQuality()` accepts accent folding and sorted name-token equivalence.
- `content.js:1876`: candidate discovery accepts those matches and collapses candidates using name-token/category/detail/email metadata. Identical metadata does not establish that two native rows represent one person.
- `content.js:1947`: resolution can select a reordered-name candidate, or a lone candidate with an unverified role. Guardian resolution also has a fallback without a confirmed relationship.
- `content.js:2120`: after the native candidate click, `addRecipientToComposer()` waits 250 ms, clears the query, and returns `added`, without requiring a selected recipient chip.
- `content.js:2049`: chip detection can accept an `aria-selected` element or ultimately a plain name marker; it does not consistently verify the role or a native removal control.
- `content.js:2025`: the retry path clears and rewrites the current query without protecting a teacher's intervening edit.
- `content.js:1518`: aggregate group-chat add also displays success after a fixed delay without verifying the selected-member result.

The search text itself does use `account.name`, preserved in `data-psqm-name`. Keep that separation. The missing protection is strict candidate resolution and observed selection success.

Required acceptance: unique exact native name and verified role -> native selection -> correct chip -> plus becomes minus -> native removal -> chip disappears -> plus returns. A click alone must not satisfy this contract.

### 2. Name normalization is not idempotent

`content.js:82` through `content.js:143` always apply role-based reordering unless a student nickname exists. A direct Node evaluation of the current functions produced:

```text
Minh Văn Nhật Nguyễn -> Nguyễn Văn Nhật Minh -> Minh Văn Nhật Nguyễn
```

Already-canonical and unknown names also change. The UI often avoids repeatedly applying the transform to its own display by retaining `data-psqm-name`; that does not protect a new native value arriving after an upstream name-order change.

Use a resolver with explicit evidence and a native-name fallback. Plain text plus a guessed family name is insufficient evidence. Structured components must be semantically verified before assuming a Vietnamese display order is appropriate for that person. The supplied October-change statement is a future scenario from the specification, not a PowerSchool change verified during this inspection.

### 3. Nicknames and class mappings have no stable person identity

- `content.js:116`, `:132`, `:580`: nickname keys use NFC/lowercased native names. Same-name students share a mapping.
- `content.js:380`: class mappings use accent-folded names. A changed name order misses the old key, and identical names cannot be separated reliably.
- `content.js:1252`: aggregate group-chat record keys also use folded name/category/contact metadata.
- `content.js:451`, `:504`, `:716`, `:1189`: account extraction and reconstruction do not carry a person ID.

A stable identity must travel through all these extraction paths and injected controls, not only through `accountDisplayName()`.

No stable person/account ID was verified in the inspected Direct messages row. Its button and ten ancestor levels had presentation classes and a repeated test ID, without an explicit person ID or person href. Directory search did not yield a usable result row during the observed loading cycle. Group Information membership IDs remain uninspected. This is not proof that PowerSchool exposes no ID anywhere.

For migration, one currently visible row is not evidence that a token signature is globally unique. Require a verified bounded candidate set or explicit review; retain all legacy data and avoid writing a permanent ID association from an incomplete or ambiguous search. Scope persistent keys by the verified school/account identity domain if IDs are not globally unique.

### 4. The existing scan cycle is the right integration point

`content.js:1630` debounces scans by 250 ms. `content.js:2328` installs one body observer. Integrate help and walkthrough updates here, with delegated input/change/click events and bounded timeouts for native loading.

Filter mutations caused by the extension's own overlay and avoid writing unchanged attributes/styles. Otherwise a spotlight can repeatedly trigger the observer that positions it. Guard initialization and clean up listeners when the guide exits.

### 5. Session persistence needs a service-worker bridge

The background script already uses `chrome.storage.session`. Chrome does not expose that area to content scripts by default. Proposed implementation: validate a small progress-message schema in `background.js`, store progress keyed by the sender tab, and return only guide/step/status/timestamps. This avoids cross-tab walkthrough collisions and needs no additional host permission.

Page refresh can retain this state; extension reload/update/disable and browser restart clear session storage. [Chrome storage documentation](https://developer.chrome.com/docs/extensions/reference/api/storage#session).

### 6. The underlying school source registry is missing

The supplied file describes SOP requirements and gives examples such as `NF-001`, `MSG-001`, and `PS014`, but the underlying SOP, complete Rule-ID/Source-ID mappings, approved links, and video/FAQ URLs are not in this workspace or attachment.

Treat the pasted specification as the implementation brief. Do not mark its illustrative IDs as independently verified school-source citations. Keep missing resources empty and source verification explicit. Title-prefix/suffix automation remains deferred.

## Live UI evidence

Surface: existing Codex in-app browser tab at `https://vas.educator.powerschool.com/`. School context visibly showed Sala - Primary. The actual account's role/permission set was not independently established; do not set `verifiedRole: teacher` solely from the educator hostname or school label.

Several native modules loaded slowly. An initial click left the old DOM visible; Directory and Messaging appeared later. The Newsfeed title initially used `input-field-null`, then settled to `input-field-compose_title`. A walkthrough must wait for initialized semantic controls and resulting state, and must not cache a transient `null` ID.

| Control | Observed locator | Status / limitation |
| --- | --- | --- |
| Newsfeed navigation | `a#post-newsfeed[href='/']`; link `Newsfeed` | Observed; navigation to heading Newsfeed verified |
| Directory navigation | `a#user-directory[href='/directory']` | Observed; Directory view opened |
| Groups navigation | `a#group-mgmt[href='/groups']` | Locator observed; destination not inspected |
| Messaging entry | `#button-header-messenger-inbox`; button `Messaging` | Opened Conversation list dialog |
| Application menu | `#button-header-application-menu` | Locator observed; educator-switcher contents unverified |
| New post | `#button-post-compose-btn`; button `+ New post` | Opened empty composer |
| Composer container | `#compose-view-layout` | Observed, contains heading New post |
| Title | `#compose-view-layout #input-field-compose_title`; label `Title` | Observed after initialization; did not enter text |
| Body | `#post-newsfeed__compose-headings__rich-text-editor [contenteditable='true']` | One visible editor observed; require visibility and uniqueness. Labelled backing textarea is not the visible editing surface |
| Audience groups | Within composer: role `combobox`, accessible name `To` | Observed; generated ID `multi-select-complex-1-main-button` should not be hard-coded |
| Audience students | `#checkbox-postnewsfeed-recipient-option-student` | Observed, label Students |
| Audience guardians | `#checkbox-postnewsfeed-recipient-option-parent` | Observed, label Guardians |
| Audience staff | `#checkbox-postnewsfeed-recipient-option-staff` | Observed, label Staff |
| Preview | `#button-post-preview-btn`; button `Preview post` | Observed disabled in empty composer; preview result and Publish remain unverified |
| Translation | `#checkbox-post-translate-checkbox`; `#button-post-translations-btn` | Observed; translation flow not exercised |
| Event entry | `#button-post-event-btn`; button `Event` | Observed within New post; does not establish a Calendar route or complete event workflow |
| New message | `#button-new-conversation-button`; button `New message` | Opened empty recipient/body composer |
| Recipient search | `#recipient-search-input`; role searchbox, name `Enter a contact name` | Observed; no recipient selected |
| Message body | `#messenger-inbox-message-input-text-field`; role textbox, name `Enter message` | Observed; no content entered |
| Send | `#button-messenger-inbox__message-input__send-btn`; button `Send Message` | Locator observed only; Send/result flow unverified |
| Direct messages row | Within list `Direct messages`: `[data-testid='messenger-channel-preview']` | Repeated control test ID, not person identity |
| Directory name search | `#input-field-mfe-directory-text-name`; textbox `Name` | Observed; narrow search reached loading state without usable identity rows |
| Directory personas | `#radio-mfe-directory-Students_id`, `#radio-mfe-directory-Guardians_id`, `#radio-mfe-directory-Staff_id` | Observed; Students selected in this view |

Audience validation must account for both the To group selector and the recipient-category checkboxes. Checking one category alone cannot prove the intended audience is complete or correct. The teacher must make and review these selections.

No Calendar navigation was visible in the inspected shell. Do not invent one. No native Publish action, publish-success marker, RSVP configuration, stable membership ID, or recipient-chip add/remove flow was verified.

The inspected empty composer contained no title/body text and no selected recipient category. No message/post was sent, saved, or published; no audience selection or extension-setting change was made. Live inspection did not establish that this local extension build is installed: the inspected tab showed no extension account-control markers.

## Checks actually run

- `node --check content.js` — passed.
- `node --check background.js` — passed.
- `node --check popup.js` — passed.
- Isolated Node VM evaluation of current name functions — reproduced non-idempotence and changes to canonical/unknown names.
- Isolated recipient-resolution function with synthetic candidates — reproduced acceptance of a reordered candidate and an unverified-role candidate.
- Isolated add-recipient function with a stub native click that creates no chip — returned `added` after one click.
- Read the manifest, README, popup, service worker, styles, and relevant content-script paths; inspected all native click call sites for their purpose. No direct send/publish call site was found in this source review.
- No existing automated suite was available. These targeted reproductions are baseline defect evidence, not end-to-end extension regression passes.
- No live extension reload/install, recipient selection, message send, post publication, or pilot teacher acceptance test was performed.

## First implementation slice to follow

1. Preserve this baseline in a separate copy and add a lightweight test harness. Repair strict native recipient resolution, teacher-edited query preservation, and real chip confirmation before calling Quick Message preserved.
2. Add `identity.js`, conservative auto/native/legacy modes, schema v2, and tests. Keep `studentNicknames`; leave persistent migration gated where stable identity or uniqueness is unavailable. Carry identity through every account extraction and class/group-chat mapping path.
3. Add `hub-ui-adapter.js` using the observations above. Distinguish `locator observed` from `action/result verified`; return an unverified result for missing or ambiguous targets. Keep the original productivity selectors isolated while incrementally adopting verified equivalents.
4. Add `guide-registry.js`, `walkthrough.js`, `context-help.js`, and `guide.css`, with the Newsfeed pilot as the first active guide. Use teacher actions plus verified DOM state, bounded waiting, accessible dismiss/retry controls, and highlight-only behavior. Stop safely at unverified audience/preview/publish results instead of claiming a complete publishing walkthrough.
5. Add service-worker progress messages and popup entry points while preserving notification and nickname settings. Feature flags should roll back each new subsystem independently.
6. Verify the remaining live Newsfeed states with a teacher-led example, then perform extension regression and pilot acceptance checks. Keep Messenger, Directory, and Calendar guides incomplete until their full flows and sources are verified.

Do not call v1.9 release-ready from this inspection. The requested first-pass endpoint remains Identity Engine + UI Adapter + Newsfeed walkthrough, with unresolved native states explicitly gated.
