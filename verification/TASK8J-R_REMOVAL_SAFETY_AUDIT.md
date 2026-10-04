# Task 8J-R — Nickname Retirement Removal Safety Audit

## Audit mode

Read-only dependency and regression-risk audit against:

- `Hub_Assistant_TASK8H_COPYRIGHT_SCHOOL_USE_BUILD.zip`
- SHA-256: `dce63daf8543e233ccaf8ab80f8efa3b922e0956061e0a84395bc174361a88ba`

No extension source was modified during this audit.

## Fresh baseline verification

- 30/30 JavaScript files pass `node --check`.
- `manifest.json` parses successfully.
- EN/VI i18n key parity is 398/398 with zero missing keys.
- Baseline archive SHA-256 remains unchanged.

## Core conclusion

Nickname can be retired without redesigning the extension, but removal must be surgical. Do not delete every symbol, selector, or string containing the word `nickname`.

The shared PowerSchool identity layer must stay intact.

## Critical finding 1 — `studentNicknameKey()` has a non-nickname consumer

`src/core/runtime/content-runtime.js` defines:

```js
function studentNicknameKey(value) {
  return cleanText(value).normalize("NFC").toLowerCase();
}
```

The same helper is used by Guardian `contactOf` exact-name validation, not only nickname storage:

```js
studentNicknameKey(relation.contactOf) !== studentNicknameKey(account.contactOf)
```

Its implementation is semantically identical to the existing `matchText()` helper.

Safety rule:

- Do not simply delete `studentNicknameKey()` and its call sites.
- Replace the Guardian relation call with the already-existing `matchText()` only if an equivalence regression test proves behavior is unchanged, or retain the helper temporarily.
- Guardian/student relation display behavior is frozen.

## Critical finding 2 — nickname initialization also owns `nameDisplayMode`

Current `initializeStudentNicknames()` does three things:

1. reads `studentNicknames`;
2. reads `studentProfiles`;
3. reads `nameDisplayMode`.

The storage-change listener also calls it when `nameDisplayMode` changes.

Deleting this function wholesale would break live Auto / Native / Legacy normalized name-display updates.

Safety rule:

Replace the nickname initializer with a name-display-only initializer, conceptually:

```text
initializeNameDisplaySettings()
  -> read nameDisplayMode only
  -> refresh existing name displays
```

The `chrome.storage.onChanged` listener must continue responding to `nameDisplayMode`.

## Critical finding 3 — `refreshNicknameDisplays()` is partly shared

Current `refreshNicknameDisplays()` does more than nickname refresh:

- schedules a full account/name rescan;
- rerenders the aggregated Group Chat list.

Both are needed when `nameDisplayMode` changes.

Safety rule:

Retain the behavior under a neutral name such as `refreshNameDisplays()`.
Do not delete the rerender loop when removing nickname persistence.

## Critical finding 4 — identity helpers are shared

Keep existing behavior of:

- `PERSON_ID_ATTR`
- `modes`
- `validText`
- `nameTokenSignature()`
- `stableKey()`
- `identityKey()`
- `role()`
- `nativeName()`
- `legacyDisplayName()`
- verified canonical-name logic
- `resolveDisplayIdentity()` for all non-nickname display modes

Current non-nickname contract snapshots include:

- stable verified student: `psid:school-a:student:123`
- fallback student: `session:["student","nguyen van an",""]`
- `Auto`, `Native`, and `Legacy normalized` display behavior must remain unchanged.

Nickname-only identity helpers may be removed after consumers are removed:

- `MAX_NICKNAME`
- `legacyNicknames()`
- `profiles()`
- `nicknameFor()`
- `initializeStorage()`
- `setNickname()`
- `migrateLegacy()`
- nickname schema `VERSION` if no remaining consumer exists
- `record` / `own` helpers only if they become unused

`resolveDisplayIdentity()` must no longer allow `options.nickname` or `account.nickname` to override the display name. The safest compatibility approach is to preserve its non-nickname return contract while making `displayName` derive only from canonical/native name logic.

## Critical finding 5 — recipient matching already uses original PowerSchool names

`addRecipientToComposer()` writes and matches `account.name`, not the rendered nickname/display label.

This is a positive separation that must not change.

Safety rule:

- Do not touch `writeRecipientName(..., account.name)`.
- Do not change `sameOriginalRecipientName()` behavior.
- Do not alter recipient resolution, selected-recipient detection, add/remove actions, or role checks.
- `accountActionName()` may be simplified to display-only text, but must never become the search identity.

## Critical finding 6 — event handling requires surgical selector edits

When removing nickname controls, preserve all other event branches.

### Direct conversation row forwarding

Current exclusion includes:

```text
.psqm-direct-add, .psqm-nickname-edit, [data-psqm-ui]
```

Remove only the nickname selector. Preserve `.psqm-direct-add` and `[data-psqm-ui]`, otherwise clicking `+` can accidentally forward a native row click.

### Click / keydown handlers

Remove only the nickname-control branch. Preserve the existing order and behavior of:

- class capture;
- Group Chat aggregate add;
- Direct `+` add/remove;
- row forwarding;
- Group Information direct-message action.

### MutationObserver filter

Remove only `.psqm-nickname-edit` from the extension-owned mutation selector. Preserve:

- `[data-psqm-ui]`
- `.psqm-direct-add`
- `.psqm-group-chat-aggregate`
- `.psqm-toast`

This protects current observer/load behavior.

## Critical finding 7 — Group Chat aggregation requires a coordinated DOM + CSS change

Current aggregate row is effectively:

```text
Name | Role | Nickname slot | +
```

and CSS uses four grid columns.

When nickname is removed:

```text
Name | Role | +
```

must use a matching three-column grid. Removing only the nickname DOM slot without updating the grid would place the `+` control in the wrong column and leave a blank column.

Do not change:

- record keys;
- `identityKey()` dedupe;
- `stableKey()` ambiguity logic;
- pagination crawling;
- native Group Chat add control semantics;
- selected-recipient behavior.

The normal Direct Messages row base padding is already defined independently of `.psqm-nickname-row`; do not opportunistically redesign Direct row spacing in this task.

## Critical finding 8 — UI adapter add-pointer contract must remain identical

`hub-ui-adapter.js` currently uses the same `messageListPointerCandidateState()` helper for `add` and `nickname` controls.

Remove only the nickname branch/target.

Baseline `add` contract verified:

- valid `+` candidate -> `true`
- busy candidate -> `false`
- disabled candidate -> `false`

These results must remain identical after 8J-R.

## Critical finding 9 — guidance removal can leave Group Information help empty

Current Group Information contextual help has exactly two tasks, both nickname-owned:

- `group-information-nickname`
- `group-information-duplicate-name`

If both are deleted with no replacement, the `? Help` panel remains available in Group Information but has no actionable content and only displays its generic intro.

Safety requirement:

Do not ship an empty/incoherent Group Information help surface.

Lowest-risk design option: replace the retired nickname content with one static identity-safety tip using already-existing neutral copy such as `Check the original name and role.` This preserves the help surface without introducing a new action or DOM target.

Alternative behavior (hiding Help only in Group Information) requires a broader contextual-help behavior change and is not preferred in this task.

## Critical finding 10 — do not delete every i18n string containing the word nickname

The following copy is NOT part of the nickname feature and must remain:

```text
Enter the Guardian/Contact's exact full account name. Keep the original name; do not use a nickname or surname-only search.
```

and its Vietnamese equivalent.

It is recipient-search safety guidance.

Remove only nickname-feature-owned keys in matched EN/VI pairs.

## Persistent data cleanup boundary

Dependency audit confirms these persistent keys are nickname-owned:

- `studentNicknames`
- `studentProfiles`
- `psqmStorageVersion`

No other current module reads them for Messages, Group Chat, class mapping, or name-display mode.

Safe cleanup must remove only these exact keys and be idempotent.

Do not remove or reset:

- `nameDisplayMode`
- `uiLanguage`
- walkthrough/onboarding progress
- contextual-help state
- Messages/Newsfeed settings

A one-time extension update cleanup is preferred over a recurring timer/poll.

## Popup removal boundary

Remove:

- `studentNicknames` / `studentProfiles` popup defaults;
- `nicknameCount()`;
- nickname-count row;
- nickname-count-only CSS;
- `popup.studentNicknames` and `popup.savedCount` when no other consumer remains.

Preserve:

- `nameDisplayMode` select and validation through `PSQM.identity.modes`;
- language controls;
- walkthrough dashboard;
- contextual-help setting;
- Task 8H copyright notice.

The popup must continue loading `identity.js` while it depends on `PSQM.identity.modes`.

## Background removal boundary

Remove nickname-only message behavior:

- `PSQM_SET_NICKNAME`
- `PSQM_INITIALIZE_IDENTITY` once its storage-version role is retired

Preserve byte/behavior contracts for:

- `PSQM_GUIDE_GET`
- `PSQM_GUIDE_SAVE`
- `assistantQueue` guide serialization
- tab-removal session cleanup
- sender/origin/frame validation

Legacy nickname-key cleanup must not be routed through or block guide-state operations.

## Guided removal order

To reduce regression risk, implement in stages and verify after every stage:

1. Lock baseline contracts and hashes.
2. Remove nickname Help/Quick Pointer entries and adapter nickname pointer target only.
3. Remove nickname UI controls and Group Chat nickname slot, preserving add/remove/event behavior.
4. Split name-display settings from nickname storage, preserving live `nameDisplayMode` refresh.
5. Remove nickname storage/message/schema code and add exact one-time legacy-key cleanup.
6. Remove nickname-only identity helpers after proving no remaining consumers.
7. Remove nickname-only EN/VI and CSS dead code.
8. Run dead-reference scan and full Phase 2 regression.
9. Run Chrome live validation.
10. Run Edge live validation.

Do not bundle unrelated refactors into any stage.

## Frozen-file hash lock

The following baseline files are unrelated to nickname removal and should remain byte-identical unless a separately proven dependency is discovered:

```text
a9e3e457ca15223f0b37950b2323afa1c3afac5eadec9d882df796f76871fc46  src/features/message-onboarding/message-onboarding.js
f6a9892b921483b1b814d7e0dfcb59a6b3ee9dd9ab38054485d11c4511ab1afc  src/features/message-mode-default/message-mode-default.js
f45c1b5e45da6603026bbc1826bb8ed4e7c247333bcc68832a508bed0e781e5c  src/features/message-information/message-information-pane-guide.js
2f36f6a80f74208d87da7d4f9e1c00d30220acca62898b23c02136accd0f8edb  src/features/newsfeed/newsfeed-readiness.js
a05154ee8410a74f60d9bb9f996db05e257eb79d6eb7953bab7f7748418b9655  src/features/guidance/guides/newsfeed-guides.js
9a79256e154fccc9735bf99f5066fbbfa05dc6b47631ac58aa9ba564b2f1fb35  src/features/onboarding/onboarding-progress.js
d8be74603e0e9932b4bdca2e189241aa8f3bcdeb425ee52f311313fed0477245  src/features/walkthrough/walkthrough.js
34b80a43597f9fe23055ec5293a110b1bdde7189c58febc21a154d35d8b26344  src/features/communication-language-warning/communication-language-warning.js
b24c50ec90d079fbecb0953859e5978b949e516c1d6e011b197a00f8e229d13c  src/features/conversation-opening/conversation-opening.js
5fd0673e4a8a70058cdc837ec4496ea9f79f5d7311de3b35135956419e7fbf01  src/state/relations/guardian-student-relations.js
eb71bee53e433691f686a58827936e4dbb5cfa03c1f414604950be93a78fa3cd  src/core/bootstrap/content.js
4cbc6a9b3eac2caf1cbbd8a7b76098387de8416f71d0c45144f49e48ee773491  manifest.json
```

The manifest does not need to change for nickname retirement: no permission increase is required.

## Candidate-diff allowlist

Expected files that may legitimately change:

- `src/state/identity/identity.js`
- `src/background/background.js`
- `src/core/runtime/content-runtime.js`
- `src/core/runtime/content-runtime.css`
- `src/popup/popup.js`
- `src/popup/popup.html`
- `src/popup/popup.css`
- `src/platform/browser/i18n.js`
- `src/platform/powerhub/hub-ui-adapter.js`
- `src/features/guidance/guides/message-guides.js`
- `src/features/guidance/guides/group-chat-guides.js`

`src/features/contextual-help/context-help.js` should remain unchanged under the preferred Group Information replacement-tip approach.

Any other changed source file is a stop-and-review event.

## Mandatory post-removal gates

A candidate must not be declared PASS unless all of the following hold:

1. All JS parses.
2. Manifest parses and permissions are unchanged.
3. EN/VI keys are exactly paired.
4. No `studentNicknames` or `studentProfiles` executable storage path remains.
5. No `PSQM_SET_NICKNAME`, nickname edit selector, nickname UI control, or nickname Quick Pointer remains.
6. The non-feature phrase `do not use a nickname` in exact-account search guidance remains.
7. `stableKey()` baseline outputs match.
8. `identityKey()` baseline outputs match.
9. Auto / Native / Legacy normalized non-nickname display outputs match.
10. `nameDisplayMode` changes still update already-open PowerHub UI.
11. Direct `+` add pointer contract matches baseline.
12. Recipient search still writes/matches original `account.name`.
13. Add/remove recipient behavior is unchanged.
14. Group Chat record dedupe/pagination is unchanged.
15. Group Chat aggregate layout has no blank nickname column.
16. Guardian `contactOf` exact-name matching is unchanged.
17. Group Information Help is not left empty/incoherent.
18. Send/Create/Publish remain teacher-controlled.
19. Frozen-file hashes match baseline.
20. Full Phase 2 regression passes before live validation.

## Audit verdict

Retiring nickname is structurally feasible and materially simpler than the IndexedDB-vault design, but the removal is not a simple delete operation.

The two highest-risk mistakes are:

1. deleting `initializeStudentNicknames()` without replacing its `nameDisplayMode` responsibility;
2. deleting `studentNicknameKey()` without preserving Guardian `contactOf` matching semantics.

With the staged removal order and mandatory gates above, 8J-R can be implemented without intentionally changing the frozen product workflows.
