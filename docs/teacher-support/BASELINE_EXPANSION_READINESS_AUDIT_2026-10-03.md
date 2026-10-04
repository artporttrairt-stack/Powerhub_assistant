# Hub Assistant Baseline Expansion Readiness Audit

Date: 2026-10-03
Scope: `Hub_Assistant_FULL_RELEASE_BUNDLE(2).zip`
Mode: read-only static architecture audit for Teacher Support expansion
Target expansion: PowerTeacher / Teacher Support with pluggable department guidance packs, starting with CAM Primary · MS1

## Executive verdict

**GO, with boundary work first.**

The uploaded bundle is a valid frozen release baseline and has several strong extension seams: a namespaced guide registry, a data-driven walkthrough engine, bilingual i18n, idempotent module registration, and explicit teacher-control/privacy boundaries.

However, the current runtime is **PowerHub-specific**. It is not safe to bolt CAM Primary MS1 logic directly into the existing PowerHub adapter/runtime. The safest expansion is a **separate PowerTeacher platform boundary and Teacher Support core**, with the existing 8J-R2 runtime left behaviorally frozen.

## Baseline integrity

- Bundle contains the Full Release Candidate built from the documented `8J-R2 LIVE PASS` runtime.
- Existing release verification states `extension/` is byte-identical to the 8J-R2 LIVE PASS runtime.
- Store package manifest bytes match the extracted extension manifest.
- Manifest V3, version 1.9.7.
- Permissions: `storage` only.
- Current host permission: `https://vas.educator.powerschool.com/*` only.
- JavaScript files: 30.
- CSS files: 10.
- Existing verification reports JS syntax 30/30 PASS.

## What is already expansion-friendly

### 1. Namespaced guide registry

`src/features/guidance/guide-registry.js` already supports registration by namespace, collision checking, immutable published guide definitions, help tasks, pointers and tips.

This proves the codebase already uses a data-driven registration pattern rather than only hard-coded procedural walkthroughs.

### 2. Walkthrough state engine

`src/features/walkthrough/walkthrough.js` has a reusable state-machine shape with start/pause/resume/restore, target verification, observed action handling, blocked states, checklists, manual acknowledgements and teacher handoff boundaries.

For Teacher Support, reuse the **design principles**, but do not refactor the existing live walkthrough during the first MS1 slice. A new Bubble Deck runtime can be built beside it and later generalized only after live validation.

### 3. Language / onboarding lifecycle seam

The language intro exposes `mount`, `destroy`, `blocksOtherOnboarding` and `onComplete`. Existing runtime activates other features after the language intro completes.

The stored UI language is extension-wide, so a PowerTeacher Teacher Support surface can reuse the existing language preference without repeating the full language-intro experience.

### 4. Testable module pattern

19 JS modules expose `module.exports`, including guide registry, walkthrough, adapters, onboarding/state helpers and identity logic. This is a good basis for deterministic Node tests around new pure state resolvers and pack selection.

### 5. Existing safety posture

The baseline already documents and enforces important boundaries:

- no external analytics/backend transmission in the audited build;
- no final Send/Create/Publish automation;
- fail-closed identity matching in sensitive messaging flows;
- no persistent student nickname/profile database;
- one shared MutationObserver and no setInterval polling.

Teacher Support should inherit the same philosophy: guide and explain, never auto-grade/save/publish.

## Expansion blockers / required boundary work

### P0 — Current manifest does not run on PowerTeacher

Current content scripts, host permissions and robot web-accessible resource are scoped only to:

`https://vas.educator.powerschool.com/*`

The PowerTeacher target seen in the project uses a different host/path (`vas.powerschool.com/teachers/...`). Therefore the current extension cannot provide Teacher Support there without an explicit new host match.

**Required:** add a separate, exact PowerTeacher host permission and a separate content-script entry for Teacher Support. Do not broaden to `<all_urls>`.

### P0 — Current adapter is PowerHub-only

`src/platform/powerhub/hub-ui-adapter.js` hard-codes PowerHub contexts such as Newsfeed, Messages, Directory and Group Chat. Its `detectContext()` rejects origins other than `https://vas.educator.powerschool.com` (except localhost test mode).

**Required:** create a sibling boundary, e.g.:

`src/platform/powerteacher/teacher-ui-adapter.js`

Do not add PowerTeacher selectors and academic context into `hub-ui-adapter.js`.

### P0 — CAM Primary MS1 must be a pack, not core logic

The current MS1 source applies only to CAM Primary. Teacher Support core must not contain hard-coded `EE/AE/ME/BE/WB`, 8 areas, or CAM-specific applicability.

**Required:** create a guidance-pack registry and ship the first pack as:

`guidance-packs/cam-primary/ms1/`

The pack owns applicability, areas, levels, official criteria, classroom evidence, subject examples, compare copy and source provenance.

### P1 — Existing shared observer is already broad

The frozen PowerHub runtime installs one shared MutationObserver on `document.body` with subtree child/character/attribute observation and debounced `scheduleScan(250)`. The shared scan invokes multiple modules in one pass.

Fresh static counts in this bundle:

- MutationObserver instances: 1
- setInterval: 0
- setTimeout occurrences: 21
- addEventListener occurrences: 61
- querySelectorAll occurrences: 99
- querySelectorAll concentrated in `content-runtime.js` (48) and `hub-ui-adapter.js` (47)

These are static occurrence counts, not simultaneous runtime-call counts.

**Required:** do not attach Teacher Support to this PowerHub scan loop. On the PowerTeacher host, create a bounded reconciliation path. Prefer route/hash events plus targeted/ephemeral observation of the PowerTeacher app root. When Teacher Support is disabled or no valid pack applies, it should install no incremental observer/timer/UI.

### P1 — Background/popup are origin-gated to PowerHub

`background.js` accepts walkthrough progress messages only from `https://vas.educator.powerschool.com`.

`popup.js` also only sends replay/help messages to tabs starting with that origin.

**Recommendation for MS1 vertical slice:** keep Teacher Support session state in the PowerTeacher content runtime and use state-from-DOM resume. Do not expand background/popup persistence in the first slice unless required. If later reused, centralize an exact supported-origin allowlist and regression-test both origins.

### P1 — Release bundle is not a development workspace

The bundle contains runtime, documentation and verification artifacts, but no package.json/test suite or repository metadata.

**Required:** do not modify the store/release bundle in place. Create a new development checkpoint/branch from the byte-identical `extension/` runtime, then add deterministic tests and produce a new release checkpoint.

## Recommended architecture boundary

```text
Hub Assistant
├── existing PowerHub runtime                 # frozen behavior
│   ├── platform/powerhub/
│   ├── existing walkthrough/help
│   └── existing Newsfeed/Messages features
│
└── Teacher Support                           # new isolated surface
    ├── core/
    │   ├── support-controller.js
    │   ├── support-state-resolver.js
    │   ├── bubble-deck.js
    │   └── support-lifecycle.js
    ├── platform/powerteacher/
    │   ├── teacher-ui-adapter.js
    │   └── teacher-context.js
    └── guidance-packs/
        └── cam-primary/
            └── ms1/
                ├── pack.js
                ├── applicability.js
                ├── criteria.js
                ├── evidence.js
                ├── examples.js
                └── sources.js
```

## Interaction lock

Teacher Support should use the already-approved interaction model:

**robot anchor → sequential floating bubbles → slide transitions**

One bubble equals one action, thought, explanation or decision. No long modal and no long side panel.

## Pack-selection contract

CAM Primary MS1 academic help may activate only when all required context is verified:

```text
PowerTeacher host verified
+ workflow = MS1
+ department/division = CAM Primary (or explicitly confirmed for this session)
+ compatible reporting context
+ compatible level scale / standard target
= CAM Primary MS1 pack active
```

Unknown or conflicting context must fail closed to generic navigation/reference help. Seeing only the text `MS1` is insufficient to activate the CAM Primary academic pack.

## First vertical slice

Build only this path first:

1. PowerTeacher host + context adapter.
2. Teacher Support robot/bubble root.
3. Task bubble: MS1.
4. Guide me / I know already.
5. Resume-from-current-state navigation to Grading → Standards.
6. Show Filter → MS1.
7. CAM Primary pack applicability gate.
8. Area-first bubble.
9. One area only for initial test: Academic Achievement.
10. Official criterion → simple explanation → classroom evidence checklist → adjacent-level compare → subject example.
11. No auto-click, auto-grade, Save, Fill or Publish.

Only after this slice passes deterministic + live tests should all 8 areas be loaded.

## Required deterministic tests before live expansion

- wrong host -> no Teacher Support runtime;
- Teacher Support disabled -> no observer/timer/UI;
- unknown department/division -> CAM Primary pack does not activate;
- `MS1` text alone -> CAM Primary pack does not activate;
- verified CAM Primary + compatible scale -> pack activates;
- current route already Standards -> guide resumes there, not Step 1;
- filter already visible -> skip gear instruction;
- MS1 already filtered -> skip navigation and open area help;
- unknown area/scale -> generic reference only;
- repeated open/close -> one support root, no duplicate listeners;
- route/class switch -> semantic state updates without stale bubble;
- existing PowerHub regression hash/tree unchanged except explicitly approved shared files.

## Release impact

Adding the PowerTeacher host is a material manifest/privacy-store change. Re-run:

- permission/data map;
- privacy policy/store disclosure review;
- static security scan;
- host/origin allowlist tests;
- Chrome/Edge live validation;
- release ZIP byte inventory.

Do not claim the old 8J-R2 store package remains the same release after this change.

## Final readiness decision

**Baseline architecture is suitable for expansion, but not by editing the current PowerHub runtime in place.**

Proceed after creating two explicit boundaries:

1. `platform/powerteacher` adapter/runtime boundary.
2. pluggable `guidance-packs` registry, starting with `cam-primary/ms1`.

With those boundaries, the current release can remain regression-locked while Teacher Support grows to additional departments later.
