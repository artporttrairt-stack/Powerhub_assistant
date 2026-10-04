# Teacher Support Phase 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish an isolated, fail-closed PowerTeacher Teacher Support foundation that can accept pluggable department guidance packs without changing existing PowerHub behavior or shipping the MS1 Bubble Deck yet.

**Architecture:** Preserve the current 8J-R2 PowerHub runtime as a protected baseline. Add a separate PowerTeacher content-script boundary, a pure/sanitized PowerTeacher context parser, an independent Teacher Support guidance-pack registry, the first CAM Primary · MS1 applicability-only pack, and a dormant lifecycle that performs no DOM observation, polling, UI mounting, storage writes, or native PowerSchool actions in Phase 0. UI, robot/bubbles, verified PowerTeacher selectors, and academic criterion rendering begin in Phase 1 after this foundation passes all gates.

**Tech Stack:** Chrome Manifest V3; plain JavaScript IIFEs on `globalThis.PSQM`; CommonJS exports for deterministic tests; Node.js built-in `node:test`/`assert` for dev-only tests; no runtime npm dependencies.

**Spec:** `docs/teacher-support/BASELINE_EXPANSION_READINESS_AUDIT_2026-10-03.md`

## Global Constraints

- Existing PowerHub runtime files under `extension/` remain byte-identical to the 8J-R2 baseline **except `extension/manifest.json`**, which is the only pre-existing runtime file Phase 0 may change.
- Do not edit `src/platform/powerhub/`, `src/core/runtime/content-runtime.js`, existing walkthrough/help modules, `src/background/background.js`, or `src/popup/*` in Phase 0.
- Add only the exact PowerTeacher host/path match `https://vas.powerschool.com/teachers/*`; do not use `<all_urls>` or broaden the existing PowerHub match.
- Manifest permissions remain exactly `storage`; no new cookie/history/identity/network permissions.
- Phase 0 creates **no visible Teacher Support UI**, adds no CSS, and does not expose the robot asset to the PowerTeacher origin yet.
- Phase 0 Teacher Support code must contain no `MutationObserver`, `setInterval`, recurring timer, permanent document/window listener, DOM mutation, or broad DOM scan.
- Phase 0 does not click, fill, grade, save, publish, send, or dispatch synthetic native events.
- Teacher Support academic packs fail closed. Seeing the text/workflow token `MS1` alone is insufficient to activate CAM Primary guidance.
- CAM Primary · MS1 activation requires verified PowerTeacher platform context, verified workflow, verified department/division, verified reporting context, and the exact compatible `EE/AE/ME/BE/WB` scale.
- Unknown, missing, conflicting, or multiple matching pack contexts return no academic pack.
- Context snapshots must not retain raw URLs, query strings, hash query values, section IDs, student IDs, class IDs, or teacher identifiers. Presence booleans are allowed where useful.
- The canonical MS1 rule source is `MS1 Report Teacher Guidance`; `MS1 All Levels Complete Bilingual` is interpretive/example support only. Phase 0 stores source IDs/roles only; it does not ship criterion text yet.
- Phase 0 is a **development checkpoint, not a store release**. Do not rebuild or overwrite `packages/Hub_Assistant_STORE_PACKAGE.zip` in this phase.
- If implementation starts from a Git repository, execute in an isolated worktree. If only the release ZIP is available, first import the byte-identical baseline into a Git repo and commit it before Task 1.

## Review Focus

1. **Wrong host or wrong `/teachers/` path** must leave Teacher Support unverified and dormant; Task 2 pins this.
2. **`MS1` token without verified CAM Primary context** must not activate the CAM Primary pack; Task 4 pins this.
3. **Multiple packs matching the same context** must be treated as ambiguous/fail-closed rather than choosing by registration order; Task 3 pins this.
4. **Any drift in protected PowerHub runtime files** must fail CI even if Teacher Support tests pass; Task 1 pins this against the release SHA inventory.
5. **Side-effect creep in Phase 0**—observer/timer/listener/storage/network/native-action code—must fail the static gate; Task 7 pins this.

---

## Exact Phase 0 File Tree

```text
Hub_Assistant_FULL_RELEASE_CANDIDATE/
├── package.json                                      # CREATE, dev-only
├── scripts/
│   └── verify-phase0.mjs                            # CREATE
├── docs/
│   ├── teacher-support/
│   │   ├── BASELINE_EXPANSION_READINESS_AUDIT_2026-10-03.md   # SPEC, copied audit
│   │   └── SOURCE_CONTRACT.md                       # CREATE
│   └── superpowers/
│       └── plans/
│           └── 2026-10-03-teacher-support-phase-0.md          # THIS PLAN
├── tests/
│   └── phase0/
│       ├── protected-baseline.test.js               # CREATE
│       ├── teacher-context.test.js                  # CREATE
│       ├── pack-registry.test.js                    # CREATE
│       ├── cam-primary-ms1-applicability.test.js    # CREATE
│       ├── support-lifecycle.test.js                # CREATE
│       ├── manifest-powerteacher-boundary.test.js   # CREATE
│       └── security-performance-static.test.js      # CREATE
└── extension/
    ├── manifest.json                                # MODIFY; only pre-existing runtime edit
    └── src/
        ├── core/
        │   └── bootstrap/
        │       └── teacher-support-content.js       # CREATE
        ├── platform/
        │   └── powerteacher/
        │       └── teacher-context.js               # CREATE
        └── features/
            └── teacher-support/
                ├── runtime/
                │   └── support-lifecycle.js         # CREATE
                ├── guidance/
                │   └── pack-registry.js             # CREATE
                └── guidance-packs/
                    └── cam-primary/
                        └── ms1/
                            ├── applicability.js      # CREATE
                            ├── sources.js            # CREATE
                            └── pack.js               # CREATE
```

### Explicitly not created in Phase 0

```text
bubble-deck.js
bubble-deck.css
robot-anchor.js
teacher-ui-adapter.js
PowerTeacher DOM selectors
MS1 area/criterion/evidence/example content files
background/popup Teacher Support persistence
PowerTeacher web_accessible_resources entry
```

Those belong to Phase 1 after a verified live PowerTeacher DOM inspection and Phase 0 gates pass.

---

### Task 1: Dev Test Harness + Protected Baseline Gate

**Files:**
- Create: `package.json`
- Create: `scripts/verify-phase0.mjs`
- Create: `tests/phase0/protected-baseline.test.js`
- Reference only: `verification/SHA256_INVENTORY.txt`

**Interfaces:**
- Consumes: repository root containing the audited release-candidate layout.
- Produces: `npm test` and `npm run verify:phase0`; protected-file hash verification for every pre-existing `extension/` file except `manifest.json`.

- [ ] **Step 1: Write the failing baseline integrity test**

Test name: `protected 8J-R2 extension files remain byte-identical except manifest.json`.

Assertions:
- Parse `verification/SHA256_INVENTORY.txt`.
- Select every baseline path beginning `./extension/` except `./extension/manifest.json`.
- SHA-256 the corresponding current file.
- Assert every current digest equals the inventory digest.
- Assert every protected baseline file still exists.

- [ ] **Step 2: Run the test before adding harness metadata**

Run: `node --test tests/phase0/protected-baseline.test.js`

Expected: PASS against the untouched imported baseline; this proves the fixture/source inventory is usable before new code is added.

- [ ] **Step 3: Add dev-only package scripts and the Phase 0 verifier**

`package.json` requirements:
- `private: true`
- no `dependencies`
- no `devDependencies`
- `test` invokes Node's built-in test runner on `tests/phase0`
- `verify:phase0` invokes `node scripts/verify-phase0.mjs`

`verify-phase0.mjs` responsibilities:
- run all `tests/phase0` tests;
- run `node --check` for every `.js` and `.mjs` under `extension/src`, `tests/phase0`, and `scripts`;
- exit non-zero on the first failed stage;
- print one compact PASS/FAIL summary per stage.

- [ ] **Step 4: Verify the harness**

Run: `npm test && npm run verify:phase0`

Expected: PASS; existing extension JavaScript syntax remains valid.

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/verify-phase0.mjs tests/phase0/protected-baseline.test.js
git commit -m "test: lock 8J-R2 baseline for teacher support"
```

---

### Task 2: Sanitized PowerTeacher Platform Context

**Files:**
- Create: `extension/src/platform/powerteacher/teacher-context.js`
- Create: `tests/phase0/teacher-context.test.js`

**Interfaces:**
- Produces: `parsePowerTeacherLocation(locationLike) -> Frozen<PowerTeacherLocationContext>`.
- Browser global: `PSQM.powerTeacherContext.parseLocation`.
- CommonJS export: `{ parsePowerTeacherLocation }`.

`PowerTeacherLocationContext` exact shape:

```text
{
  platform: "powerteacher" | "unknown",
  platformVerified: boolean,
  originVerified: boolean,
  pathVerified: boolean,
  routePath: string,          // sanitized hash pathname only, e.g. "/classes/assignments"
  sectionPresent: boolean,    // boolean only; never return sectionId value
  reason: string
}
```

- [ ] **Step 1: Write failing location-context tests**

Required cases:
- `https://vas.educator.powerschool.com/...` -> `platformVerified === false`.
- `https://vas.powerschool.com/` outside `/teachers/` -> false.
- `https://vas.powerschool.com/teachers/index.html#/classes/assignments?sectionId=9750` -> verified, `routePath === "/classes/assignments"`, `sectionPresent === true`.
- same valid route without `sectionId` -> verified, `sectionPresent === false`.
- returned object contains no raw URL, `hash`, query string, or section ID value.
- output is frozen.

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test tests/phase0/teacher-context.test.js`

Expected: FAIL because `teacher-context.js` does not exist.

- [ ] **Step 3: Implement only sanitized location parsing**

Do not inspect DOM, infer department, infer reporting term, or infer Standards route semantics. Phase 0 only verifies host/path and sanitizes SPA route-path presence.

- [ ] **Step 4: Run tests and baseline gate**

Run: `node --test tests/phase0/teacher-context.test.js && node --test tests/phase0/protected-baseline.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add extension/src/platform/powerteacher/teacher-context.js tests/phase0/teacher-context.test.js
git commit -m "feat: add sanitized PowerTeacher context boundary"
```

---

### Task 3: Independent Teacher Support Pack Registry

**Files:**
- Create: `extension/src/features/teacher-support/guidance/pack-registry.js`
- Create: `tests/phase0/pack-registry.test.js`

**Interfaces:**
- Produces: `createPackRegistry()`.
- Registry methods: `register(pack)`, `get(id)`, `list()`, `select(context)`, `snapshot()`.
- Browser global singleton: `PSQM.teacherSupportPackRegistry`.
- CommonJS export: `{ createPackRegistry }`.

Minimal pack contract for Phase 0:

```text
{
  id: string,
  version: string,
  workflow: string,
  sourceIds: readonly string[],
  applicability(context) -> { matched: boolean, reason: string }
}
```

`select(context)` exact outcomes:

```text
{ status: "matched", pack, matchIds: [id] }
{ status: "none", pack: null, matchIds: [] }
{ status: "ambiguous", pack: null, matchIds: [idA, idB, ...] }
```

- [ ] **Step 1: Write failing registry tests**

Required cases:
- missing/blank pack ID rejected;
- duplicate pack ID rejected;
- registration/list order deterministic;
- zero matches -> `none`;
- exactly one match -> `matched`;
- two matches -> `ambiguous` and no selected pack;
- returned pack/list/selection snapshots are immutable enough that callers cannot mutate registered definitions.

- [ ] **Step 2: Run RED**

Run: `node --test tests/phase0/pack-registry.test.js`

Expected: FAIL because registry module does not exist.

- [ ] **Step 3: Implement the registry without reusing `guide-registry.js`**

Reason: existing guide registry is live PowerHub behavior. Phase 0 copies the proven namespaced/data-driven pattern conceptually but does not refactor or couple to the live registry.

- [ ] **Step 4: Run registry + baseline tests**

Run: `node --test tests/phase0/pack-registry.test.js && node --test tests/phase0/protected-baseline.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add extension/src/features/teacher-support/guidance/pack-registry.js tests/phase0/pack-registry.test.js
git commit -m "feat: add teacher support guidance pack registry"
```

---

### Task 4: CAM Primary · MS1 Applicability-Only Pack

**Files:**
- Create: `extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/applicability.js`
- Create: `extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/sources.js`
- Create: `extension/src/features/teacher-support/guidance-packs/cam-primary/ms1/pack.js`
- Create: `tests/phase0/cam-primary-ms1-applicability.test.js`
- Create: `docs/teacher-support/SOURCE_CONTRACT.md`

**Interfaces:**
- Produces: `matchesCamPrimaryMs1(context) -> { matched: boolean, reason: string }`.
- Produces pack ID exactly: `cam-primary.ms1`.
- Produces pack version initially: `1.0.0`.
- Produces source IDs: `cam-primary-ms1-official` and `cam-primary-ms1-interpretive`.
- `pack.js` registers the pack with `PSQM.teacherSupportPackRegistry` in browser context and exports `createCamPrimaryMs1Pack` for Node tests.

Required verified context contract:

```text
context.platform === "powerteacher"
context.platformVerified === true
context.workflow === "ms1"
context.workflowVerified === true
context.department.code === "CAM"
context.department.verified === true
context.division.code === "PRIMARY"
context.division.verified === true
context.reportingContextVerified === true
context.scale.verified === true
context.scale.codes deep-equals ["EE", "AE", "ME", "BE", "WB"]
```

- [ ] **Step 1: Write failing applicability tests**

Required negative cases, each independently asserted:
- `MS1` workflow token alone;
- unknown department;
- CAM with unknown division;
- Primary with unverified department evidence;
- wrong scale order/content;
- unverified reporting context;
- wrong platform.

Required positive case:
- all fields above verified exactly -> match.

- [ ] **Step 2: Run RED**

Run: `node --test tests/phase0/cam-primary-ms1-applicability.test.js`

Expected: FAIL because pack files do not exist.

- [ ] **Step 3: Implement applicability, source IDs, and pack registration**

Do **not** add the eight areas, official criterion text, classroom evidence, checklists, comparisons, or subject examples in Phase 0.

- [ ] **Step 4: Write `SOURCE_CONTRACT.md`**

Document exactly:
- `cam-primary-ms1-official` = canonical/master source, `MS1 Report Teacher Guidance`;
- `cam-primary-ms1-interpretive` = classroom interpretation/example source, `MS1 All Levels Complete Bilingual`;
- interpretive material may clarify but may not replace, broaden, contradict, or create score cut-offs beyond the official source;
- future content must trace every explanation/checklist/example to a parent official criterion.

- [ ] **Step 5: Run pack tests + full Phase 0 tests so far**

Run: `npm test`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add extension/src/features/teacher-support/guidance-packs/cam-primary/ms1 tests/phase0/cam-primary-ms1-applicability.test.js docs/teacher-support/SOURCE_CONTRACT.md
git commit -m "feat: add fail-closed CAM Primary MS1 pack contract"
```

---

### Task 5: Dormant Teacher Support Lifecycle

**Files:**
- Create: `extension/src/features/teacher-support/runtime/support-lifecycle.js`
- Create: `tests/phase0/support-lifecycle.test.js`

**Interfaces:**
- Produces: `createSupportLifecycle({ getContext, packRegistry, onReady })`.
- Methods: `start()`, `reconcile(context?)`, `stop()`, `snapshot()`.
- Browser global singleton: `PSQM.teacherSupportLifecycle`.
- CommonJS export: `{ createSupportLifecycle }`.

Lifecycle states:

```text
DORMANT      no matching academic pack
READY        exactly one verified pack matched
AMBIGUOUS    more than one pack matched; fail closed
STOPPED      explicitly stopped
```

Phase 0 side-effect contract:
- `start()` reads one sanitized context snapshot and selects a pack;
- `reconcile(context?)` is explicit-call only; it installs no observer/listener/timer;
- actual browser singleton uses no `onReady` side effect in Phase 0;
- no UI mount occurs even if a synthetic test context reaches `READY`.

- [ ] **Step 1: Write failing lifecycle tests**

Required cases:
- no match -> `DORMANT`;
- ambiguous -> `AMBIGUOUS`;
- verified single match -> `READY`;
- repeated `start()` remains idempotent;
- `stop()` -> `STOPPED`;
- no-match path never calls injected `onReady`;
- browser implementation source contains no implicit scheduling primitive.

- [ ] **Step 2: Run RED**

Run: `node --test tests/phase0/support-lifecycle.test.js`

Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement pure lifecycle**

Keep it independent from existing `PSQM.walkthrough`, `PSQM.help`, `PSQM.ui`, popup state, and background progress persistence.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add extension/src/features/teacher-support/runtime/support-lifecycle.js tests/phase0/support-lifecycle.test.js
git commit -m "feat: add dormant teacher support lifecycle"
```

---

### Task 6: Exact PowerTeacher Manifest Boundary + Bootstrap

**Files:**
- Modify: `extension/manifest.json`
- Create: `extension/src/core/bootstrap/teacher-support-content.js`
- Create: `tests/phase0/manifest-powerteacher-boundary.test.js`

**Interfaces:**
- PowerTeacher content script match exactly: `https://vas.powerschool.com/teachers/*`.
- `teacher-support-content.js` calls only `PSQM.teacherSupportLifecycle.start()` once at `document_idle`.

PowerTeacher content-script JS load order must be exactly:

```text
src/platform/powerteacher/teacher-context.js
src/features/teacher-support/guidance/pack-registry.js
src/features/teacher-support/guidance-packs/cam-primary/ms1/applicability.js
src/features/teacher-support/guidance-packs/cam-primary/ms1/sources.js
src/features/teacher-support/guidance-packs/cam-primary/ms1/pack.js
src/features/teacher-support/runtime/support-lifecycle.js
src/core/bootstrap/teacher-support-content.js
```

No CSS entry for this content script in Phase 0.

- [ ] **Step 1: Write failing manifest boundary tests**

Assertions:
- existing PowerHub host permission still present exactly;
- add exact PowerTeacher host permission `https://vas.powerschool.com/teachers/*`;
- permissions remain exactly `['storage']`;
- no `<all_urls>`;
- existing PowerHub content-script object remains deep-equal to the audited 1.9.7 baseline object;
- exactly one separate PowerTeacher content-script entry exists with the ordered JS list above;
- PowerTeacher content script has no CSS;
- `run_at === 'document_idle'`;
- existing `web_accessible_resources` remains PowerHub-only in Phase 0;
- no background/popup files are added to the PowerTeacher entry.

- [ ] **Step 2: Run RED**

Run: `node --test tests/phase0/manifest-powerteacher-boundary.test.js`

Expected: FAIL because manifest lacks the PowerTeacher boundary.

- [ ] **Step 3: Modify manifest and add the one-line bootstrap**

Do not bump store/version metadata in Phase 0; this remains a development checkpoint.

- [ ] **Step 4: Run syntax + manifest + protected baseline gates**

Run: `npm run verify:phase0`

Expected: PASS. `protected-baseline.test.js` ignores only the manifest hash and must still verify every other pre-existing runtime file byte-for-byte.

- [ ] **Step 5: Commit**

```bash
git add extension/manifest.json extension/src/core/bootstrap/teacher-support-content.js tests/phase0/manifest-powerteacher-boundary.test.js
git commit -m "feat: add isolated PowerTeacher content boundary"
```

---

### Task 7: Static Security / Performance / Teacher-Control Gate

**Files:**
- Create: `tests/phase0/security-performance-static.test.js`
- Modify: `scripts/verify-phase0.mjs` only if needed to surface a clearer gate summary.

**Interfaces:**
- Produces a static gate over only the new Phase 0 Teacher Support runtime files plus the Teacher Support bootstrap.

Forbidden Phase 0 runtime tokens/behaviors:

```text
MutationObserver
setInterval
setTimeout(
requestAnimationFrame(
addEventListener(
document.querySelectorAll(
document.querySelector(
fetch(
XMLHttpRequest
WebSocket
chrome.storage.local.set
chrome.storage.session.set
.click(
dispatchEvent(
```

Also assert:
- no `console.log`/`console.debug` in new runtime modules;
- no literal section ID from test fixtures appears in extension runtime source;
- no raw PowerTeacher full URL is persisted in source constants other than the exact allowed manifest match/origin verification constant.

- [ ] **Step 1: Write the static test and confirm it catches a controlled fixture violation**

Use a temporary in-test string/fixture to prove the matcher flags at least `MutationObserver` and `.click(`; do not edit runtime files just to make the test fail.

- [ ] **Step 2: Run the static gate**

Run: `node --test tests/phase0/security-performance-static.test.js`

Expected: PASS on compliant Phase 0 code.

- [ ] **Step 3: Run the complete automated gate**

Run: `npm run verify:phase0`

Expected:
- all tests PASS;
- all extension/test/script JS syntax PASS;
- protected baseline PASS;
- manifest boundary PASS;
- static security/performance PASS.

- [ ] **Step 4: Manual live smoke on PowerHub**

Load the unpacked development checkpoint and verify on `vas.educator.powerschool.com`:
- existing language onboarding behaves unchanged;
- Newsfeed/Messages/Directory/Group Chat smoke paths still behave as before;
- no new Teacher Support UI appears;
- browser console shows no new Teacher Support errors.

**Pass gate:** no observable PowerHub regression.

- [ ] **Step 5: Manual live smoke on PowerTeacher**

Open the observed PowerTeacher `/teachers/index.html` surface and verify:
- extension loads without console errors;
- no robot/bubble/Teacher Support UI appears in Phase 0;
- no Teacher Support DOM nodes are added;
- no Teacher Support observer/timer/persistent listener is installed by the new code;
- existing PowerTeacher interactions remain untouched.

**Pass gate:** PowerTeacher stays visually and behaviorally unchanged while the isolated boundary loads dormant.

- [ ] **Step 6: Commit**

```bash
git add tests/phase0/security-performance-static.test.js scripts/verify-phase0.mjs
git commit -m "test: gate teacher support phase 0 side effects"
```

---

## Phase 0 Test Gates — Release to Phase 1

Phase 1 may start only when **all** gates below are green:

| Gate | Must prove | Pass condition |
|---|---|---|
| G0 Baseline integrity | PowerHub protected runtime untouched | Every pre-existing `extension/` file except manifest matches audited SHA-256 |
| G1 Syntax | New and existing JS parse | `node --check` passes for all scanned files |
| G2 Host isolation | Teacher Support runs only on exact PowerTeacher path | Manifest tests pass; no broad host |
| G3 Sanitized context | No raw URL/section identity carried forward | Context tests pass; output contains only sanitized route path + presence boolean |
| G4 Pack registry | Deterministic, collision-safe, fail-closed selection | none/matched/ambiguous tests pass |
| G5 CAM applicability | No false CAM Primary activation | every unknown/partial context fails; only full verified contract matches |
| G6 Zero-side-effect lifecycle | Dormant foundation costs no observer/timer/UI | lifecycle + static tests pass |
| G7 Teacher control | No synthetic native action capability introduced | static gate finds no click/dispatch/fill/save primitives |
| G8 PowerHub live regression | Existing product still behaves as 8J-R2 | manual smoke PASS |
| G9 PowerTeacher live dormant smoke | New boundary loads safely before feature UI | no UI/DOM mutation/errors and no persistent runtime hooks |

**Hard stop:** any failure in G0, G2, G5, G6, G7, G8, or G9 blocks Phase 1.

---

## Phase 1 Entry Criteria

Once Phase 0 passes, the next plan may add only the first vertical slice:

```text
verified PowerTeacher DOM adapter
→ robot anchor
→ sequential Bubble Deck
→ MS1 / Guide me / I know already
→ resume-from-current-state navigation
→ Grading → Standards → Show Filter → MS1
→ verified/confirmed CAM Primary pack gate
→ Academic Achievement only
→ official → explain → checklist → adjacent compare → subject example
```

Phase 1 still must not auto-click, auto-grade, fill, save, publish, send, or infer a CAM Primary academic rule from appearance alone.

## Self-Review Result

- **Spec coverage:** baseline protection, new host boundary, separate PowerTeacher platform boundary, pluggable guidance packs, CAM Primary fail-closed gating, zero incremental runtime cost when dormant, privacy-safe context, and test gates are all assigned to concrete tasks.
- **Step scan:** each task has a RED/implementation/GREEN/commit cycle; no Phase 1 UI work is hidden inside Phase 0.
- **Type consistency:** registry selection states are `matched | none | ambiguous`; lifecycle states are `DORMANT | READY | AMBIGUOUS | STOPPED`; pack ID is consistently `cam-primary.ms1`.
- **Review Focus:** all five listed failure classes have owning tests/tasks.
- **Proportion:** the plan specifies interfaces and gates, not implementation bodies; academic content and DOM selectors are intentionally deferred.
