# Hub Assistant Step 9 — Live Runtime Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended for maximum independent review) or superpowers:executing-plans (recommended when quota efficiency is the priority) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the frozen Step 5-8 Teacher Support engine, CAM Primary MS1 policy/content, and Step 8 generic UI into live PowerTeacher through one fail-closed lifecycle owner, with no native automation, no stale academic context, no native obstruction, bounded runtime cost, and an authorized live validation gate.

**Architecture:** Add a thin integration wedge only. `runtime-targets.js` owns PowerTeacher-specific target/geometry lookup, `support-runtime.js` is the sole lifecycle/epoch/reconcile owner, and `bootstrap/powerteacher.js` performs deterministic dependency wiring. Existing resolver/controller/content/Step 8 placement/UI remain authoritative and frozen; `manifest.json` only activates the already-approved modules on the existing PowerTeacher content-script boundary.

**Tech Stack:** Chrome Manifest V3; plain JavaScript IIFEs on `globalThis.HubAssistantTeacherSupport`; Node.js built-in `node:test` + `assert`; dependency-free fake DOM/geometry fixtures; PowerShell verification runner; local packaged assets only; no new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-10-06-step-09-live-runtime-integration-design.md`

## Global Constraints

- Implementation input is the **exact final Step 8 runtime artifact**, not an older repo reconstruction.
- Before runtime edits, read the final Step 8 hash inventory, recompute the Step 8 runtime ZIP SHA-256, require exact equality, and record it in the Step 9 evidence ledger.
- Do not invent a Step 8 SHA-256 if the final inventory is not available. Missing/unverifiable Step 8 input is a hard stop.
- Normal Step 9 runtime delta from frozen Step 8 is exactly:
  - create `extension/modules/teacher-support/platform/powerteacher/runtime-targets.js`;
  - create `extension/modules/teacher-support/runtime/support-runtime.js`;
  - create `extension/modules/teacher-support/bootstrap/powerteacher.js`;
  - modify `extension/manifest.json`.
- Package-root equivalents are `modules/teacher-support/...`; verification-only files do not count toward runtime delta.
- Frozen Step 5-8 runtime files remain byte-identical in the normal path except the explicitly authorized `manifest.json` activation delta.
- If a frozen interface appears insufficient, persist a minimal RED regression proving the interface defect and stop that change for explicit review. Do not silently refactor a frozen file.
- `support-runtime.js` is the sole Teacher Support lifecycle owner.
- Exactly one Teacher Support root is allowed: `#hub-assistant-teacher-support-root`.
- Keep the Step 3/4 generic contracts: `createWorkflowRegistry()`, `resolveSupportState({ selection, workflowDecision, uiState, context, mode })`, and `createSupportController({ registry, resolveSupportState })` with controller `evaluate({ context, uiState, mode })`.
- Keep the Step 6 MS1 pack contract and two-gate separation: coarse workflow applicability is not contextual academic eligibility.
- The exact compatible MS1 scale remains `["EE","AE","ME","BE","WB"]`; Step 9 must not infer or recommend any code.
- Step 7 academic content/policy remains frozen: 8 categories x 5 levels = 40 canonical criterion cells; official English source remains authoritative; VI remains optional source-backed interpretive support.
- Step 8 pure placement API remains authoritative: `resolveTeacherSupportPlacement(input)` with safe-placement -> alternate -> compact -> collapsed -> suspended behavior.
- Step 8 UI consumes only sanitized view models/geometry and emits semantic intents. Native selectors/nodes never enter Step 8 UI APIs.
- Never auto-click native PowerTeacher controls.
- Never call native `.click()`, `dispatchEvent()`, synthetic input/keyboard events, Fill, grade selection, Save, Publish, Send, Undo, Recalculate, comment/flag mutation, or any SIS write.
- Do not add network, analytics, telemetry, CDN, external backend, external runtime dependency, or new Teacher Support persistence.
- Do not persist/log student/teacher identity, raw section IDs, person/user IDs, emails, cookies, auth/tokens, scores, grades, comments, SIS payloads, selected academic judgement, or teacher technical-skill classification.
- Do not use `MutationObserver(document.body)`, polling, `setInterval`, recurring `requestAnimationFrame`, recursive timeout loops, or continuous full-document scans.
- A scoped `MutationObserver` is permitted only on the smallest verified course/Standards container, only to invalidate, and must be disconnected/rebound deterministically.
- Native mouse/touch/wheel/keyboard/focus/scroll must remain usable while Hub is visible.
- Every opaque/interactive Hub surface must avoid all caller-supplied protected native interaction rectangles plus clearance.
- Target hint remains pointer-transparent, non-opaque over the target, finite-motion, and removed on target/context invalidation.
- Same-route class switch and persisted `MS1` filter must not preserve old academic eligibility.
- Stale epoch results must never be applied.
- Never use a fixed absolute cell index for rubric strand identity.
- If a native target is not verified, explain without spotlight; never guess a selector.
- Current product exposes MS1 only; do not create future-guide placeholders.
- Do not merge `main`, publish a Store ZIP, bump production version, or call Step 9 production-ready.
- Engineering-only completion string: `STEP 9 ENGINEERING COMPLETE - AWAITING AUTHORIZED LIVE VALIDATION`
- Final live completion string: `STEP 9 LIVE RUNTIME INTEGRATION PASS - READY FOR CONVERGENCE REVIEW`

## Runtime File Map — Locked

```text
extension/
├── manifest.json                                      # MODIFY: activation only
└── modules/
    └── teacher-support/
        ├── platform/
        │   └── powerteacher/
        │       └── runtime-targets.js                 # CREATE
        ├── runtime/
        │   └── support-runtime.js                     # CREATE
        └── bootstrap/
            └── powerteacher.js                        # CREATE

verification/
└── step09/
    ├── fake-runtime-env.cjs                           # CREATE
    ├── authority-baseline.test.cjs                    # CREATE
    ├── runtime-targets.test.cjs                       # CREATE
    ├── support-runtime.test.cjs                       # CREATE
    ├── manifest-bootstrap.test.cjs                    # CREATE
    ├── epoch-invalidation.test.cjs                    # CREATE
    ├── route-class-matrix.test.cjs                    # CREATE
    ├── stress-lifecycle.test.cjs                      # CREATE
    ├── stress-invalidation.test.cjs                   # CREATE
    ├── stress-epoch.test.cjs                          # CREATE
    ├── static-safety.test.cjs                         # CREATE
    ├── evidence-ledger.json                           # CREATE/UPDATE
    └── run-tests.ps1                                  # CREATE
```

Do not create additional runtime files unless a reviewed RED interface defect requires a spec amendment.

## Runtime Interfaces — Locked

### `runtime-targets.js`

Produce:

```js
HubAssistantTeacherSupport.createPowerTeacherRuntimeTargets(options)
```

Options:

```js
{
  documentLike,
  getComputedStyle,
  uiAdapter
}
```

Returned API:

```js
{
  readTargetRect({ targetKey, semanticState }),
  readProtectedRects({ semanticState, targetKey, surfaceKind }),
  readObservationNodes(),
  classifyNativeInteraction(target)
}
```

Contracts:
- `readTargetRect(...)` returns a frozen sanitized `{ top, left, width, height }` or `null`.
- `readProtectedRects(...)` returns a frozen array of sanitized positive finite rectangles only.
- `readObservationNodes()` returns internal live DOM references for the smallest current course-context and Standards-surface nodes only; these nodes never pass into Step 8 UI or pure placement APIs.
- `classifyNativeInteraction(target)` delegates/aligns with the frozen platform adapter semantics and never performs a native action.
- Detached/hidden/ambiguous/unverified target -> `null` / empty fail-closed result.
- No persistence and no listener/observer ownership in this file.

### `support-runtime.js`

Produce:

```js
HubAssistantTeacherSupport.createTeacherSupportRuntime(options)
```

Options:

```js
{
  windowLike,
  documentLike,
  MutationObserverCtor,
  queueMicrotaskFn,
  adapter,
  registry,
  controller,
  ms1Pack,
  ms1Content,
  runtimeTargets,
  interaction,
  ui
}
```

Where `interaction` supplies the frozen Step 8 pure functions and `ui` supplies the frozen Step 8 UI factories/APIs.

Returned API:

```js
{
  start(),
  invalidate(reason),
  reconcile(),
  handleIntent(intent),
  dispose(),
  getDebugState()
}
```

`getDebugState()` is read-only deterministic verification state only and must expose no sensitive native data. It may expose counts/state labels such as `phase`, `epoch`, `dirty`, `reconcileCount`, `listenerCount`, `observerCount`, and current sanitized semantic fingerprint.

Lifecycle phases:

```text
STOPPED
OBSERVING
DIRTY
RESOLVING
ACTIVE
PASSIVE
```

### `bootstrap/powerteacher.js`

Produce one idempotent boot entry:

```js
HubAssistantTeacherSupport.bootstrapPowerTeacherSupport()
```

and a test/teardown-only accessor:

```js
HubAssistantTeacherSupport.disposePowerTeacherSupport()
```

Bootstrap must create at most one runtime instance, start it once, and own no business logic/selectors.

## Verification Strategy — Quota-Aware

Use the smallest sufficient test after each edit.

```text
runtime-targets.js change
-> runtime-targets.test.cjs

support-runtime.js lifecycle change
-> support-runtime.test.cjs + epoch-invalidation.test.cjs when relevant

manifest/bootstrap change
-> manifest-bootstrap.test.cjs

stress harness only
-> affected stress test

frozen Step 5-8 file changed unexpectedly
-> STOP; do not hide with broader reruns
```

Do not run all frozen regression and all stress after each small edit.

Full frozen regression, full Step 8 placement stress, package/re-extract/replay, and whole-step independent review occur at the final engineering gate.

## Review Focus

1. **Same normalized route, different class while `MS1` filter persists:** old inspector/target/academic eligibility must clear before fresh context is applied. Task 5 pins this.
2. **Mutation/event burst during grid replacement:** callbacks must coalesce to bounded reconciliation without recursive rendering or applying an old epoch. Tasks 2 and 6 pin this.
3. **Detached/hidden target after geometry measurement:** old geometry must never leave or resurrect an orphan spotlight. Tasks 3 and 6 pin this.
4. **Repeated start/bootstrap/dispose/reload:** exactly one owner/root/listener set while active and zero Step 9 runtime resources after dispose. Tasks 2, 4, and 6 pin this.
5. **Manifest activation/load-order drift:** UI/runtime must load once on the existing approved PowerTeacher match with no new permission or broader origin. Task 4 pins this.

---

# Batch A — Authority Freeze + Runtime Contract

### Task 1: Lock the Exact Step 8 Input, Delta Boundary, and Evidence Ledger

**Files:**
- Create: `verification/step09/authority-baseline.test.cjs`
- Create: `verification/step09/evidence-ledger.json`
- Create: `verification/step09/run-tests.ps1`
- No runtime file edits.

**Interfaces:**
- Consumes: exact final Step 8 runtime ZIP + Step 8 handoff + `STEP_08_FINAL_ARTIFACTS_SHA256.txt`.
- Produces: machine-readable verified Step 8 runtime SHA, runtime file inventory, frozen-file hash map, manifest snapshot, and evidence-ledger dependency keys used by all later tasks.

- [ ] **Step 1: Read only the Step 8 final handoff and final SHA inventory**

Do not reread older Step 8 drafts. Record exact final runtime filename and expected SHA-256.

- [ ] **Step 2: Write the failing authority test**

Assertions:
- exact Step 8 ZIP exists;
- recomputed SHA equals the final inventory;
- archive extracts successfully;
- runtime contains the Step 8 five UI files;
- manifest is present;
- no Step 9 runtime files exist yet;
- normalized inventory/hashes can be generated deterministically.

- [ ] **Step 3: Run RED against a workspace without Step 9 verification metadata**

Run: `node --test verification/step09/authority-baseline.test.cjs`

Expected: RED because Step 9 evidence metadata/ledger is not yet populated, not because the Step 8 artifact is invalid.

- [ ] **Step 4: Create the minimal evidence ledger**

Use compact fields only:

```text
gate
dependency
dependencyHash
result
stillValid
rerunRequired
evidence
```

Initial gates:
- `step8-input-sha`;
- `step8-runtime-inventory`;
- `step8-manifest-snapshot`;
- `step8-frozen-hash-map`.

Do not paste verbose test output into the ledger.

- [ ] **Step 5: Run GREEN**

Expected:
- exact Step 8 SHA verified;
- deterministic frozen inventory recorded;
- Step 9 runtime delta allowlist recorded.

- [ ] **Step 6: Commit**

```text
git add verification/step09
git commit -m "test: lock Step 9 frozen input"
```

**Batch A quota rule:** verified Step 8 handoff/hash/inventory are read-once authority. Do not reread unless their dependency hash changes.

---

### Task 2: Build the Sole Runtime Lifecycle with RED-First Idempotency and Coalescing

**Files:**
- Create: `extension/modules/teacher-support/runtime/support-runtime.js`
- Create: `verification/step09/fake-runtime-env.cjs`
- Create: `verification/step09/support-runtime.test.cjs`
- Update: `verification/step09/evidence-ledger.json`

**Interfaces:**
- Produces `createTeacherSupportRuntime(options)` and returned API exactly as locked above.
- Does not yet implement live PowerTeacher target geometry; use fake `runtimeTargets`.
- Consumes frozen adapter/controller/registry/pack/Step 8 UI through injected interfaces only.

- [ ] **Step 1: Write RED lifecycle-state tests**

Assert:
- initial phase `STOPPED`;
- first `start()` -> observing + exactly one registered window route-listener pair;
- repeated `start()` does not increase listener/observer/root counts;
- `dispose()` clears runtime-owned listeners/observers/pending reconcile;
- repeated `dispose()` is harmless;
- `getDebugState()` contains no names, IDs, scores, grades, comments, URLs with query data, or DOM nodes.

- [ ] **Step 2: Write RED invalidate/coalesce tests**

Use injected `queueMicrotaskFn`.

Assert:
- multiple `invalidate()` calls inside one pending window schedule one reconcile;
- no recursive reconcile;
- dirty flag clears after reconcile;
- final semantic state wins;
- no recurring idle work is scheduled.

- [ ] **Step 3: Write RED fail-closed reconcile tests**

Adapter/controller fake cases:
- unsupported state -> `PASSIVE`;
- adapter throws -> transient academic/target UI cleared and native page untouched;
- controller returns ambiguous/unverified -> no academic render;
- supported state -> `ACTIVE`;
- one primary semantic read per reconcile.

- [ ] **Step 4: Run RED**

Run: `node --test verification/step09/support-runtime.test.cjs`

Expected: FAIL because runtime export is missing.

- [ ] **Step 5: Implement minimal lifecycle**

Implement only:
- phase;
- listener registry;
- dirty/pending reconcile;
- one semantic read per reconcile;
- controller evaluation;
- fail-closed UI clear/update calls;
- debug counters;
- dispose.

Do not add PowerTeacher selectors, academic criterion strings, placement math, or observer-specific platform logic.

- [ ] **Step 6: Run GREEN**

Expected: focused lifecycle suite PASS.

- [ ] **Step 7: Run static quick scan**

Reject in `support-runtime.js`:
- PowerTeacher selectors;
- `EE|AE|ME|BE|WB` grading policy;
- academic category titles;
- `.click(`;
- `dispatchEvent`;
- `setInterval`;
- recurring RAF;
- network/storage writes.

- [ ] **Step 8: Record evidence and commit**

```text
git add extension/modules/teacher-support/runtime/support-runtime.js verification/step09
git commit -m "feat: add single-owner teacher-support runtime"
```

**Batch A Gate:** Tasks 1-2 focused tests PASS. Do not run frozen 300/300 or Step 8 10k placement yet.

---

# Batch B — Native Targets, Geometry, Bootstrap Activation

### Task 3: Add Verified Native Target Mapping and Sanitized Geometry

**Files:**
- Create: `extension/modules/teacher-support/platform/powerteacher/runtime-targets.js`
- Create: `verification/step09/runtime-targets.test.cjs`
- Update: `verification/step09/fake-runtime-env.cjs`
- Modify: `extension/modules/teacher-support/runtime/support-runtime.js` only for locked runtime-target API hookup.
- Update: `verification/step09/evidence-ledger.json`

**Interfaces:**
- Produces `createPowerTeacherRuntimeTargets(options)`.
- Uses existing PowerTeacher adapter/contract; selectors remain platform-owned.
- Runtime receives sanitized numeric rectangles only for Step 8 placement/hint APIs.

- [ ] **Step 1: Write RED target-rect tests**

Cover:
- known semantic target -> positive finite rect;
- missing selector/target -> `null`;
- hidden target -> `null`;
- detached/replaced target -> `null`;
- malformed `getBoundingClientRect()` -> `null`;
- no student/teacher/native text leaks in returned value.

- [ ] **Step 2: Write RED selected-standard semantic mapping tests**

Fixtures prove:
- selected `td.standard-col` maps by relative standard-column position;
- changing leading native columns does not change mapped rubric identity;
- fixed absolute `cellIndex` is never used;
- ambiguous/multiple selected cells -> no target;
- look-alike/non-rubric current column -> no academic target.

- [ ] **Step 3: Write RED protected-rectangle tests**

Assert:
- only visible, positive, finite relevant native interaction rectangles are returned;
- duplicates collapse deterministically;
- hidden/detached/zero-size nodes omitted;
- collection bounded to current relevant surface;
- no full-document element enumeration.

- [ ] **Step 4: Write RED observation-node tests**

`readObservationNodes()` returns only smallest current:
- course-context node;
- Standards surface/grid node.

Missing/ambiguous nodes return null entries; no broad body/document observation target is returned.

- [ ] **Step 5: Run RED**

Run: `node --test verification/step09/runtime-targets.test.cjs`

- [ ] **Step 6: Implement minimal runtime-targets module**

Do not add event listeners or observers here.

- [ ] **Step 7: Wire geometry into runtime**

Only when UI requires placement or target hint:
- read protected rects;
- call frozen `resolveTeacherSupportPlacement(...)`;
- pass placement result to frozen Step 8 UI;
- pass only sanitized `{ rect, label, pulse }` to target hint;
- clear hint on null/unsafe/stale target.

- [ ] **Step 8: Run GREEN**

Run:
`node --test verification/step09/runtime-targets.test.cjs verification/step09/support-runtime.test.cjs`

- [ ] **Step 9: Commit**

```text
git add extension/modules/teacher-support/platform/powerteacher/runtime-targets.js extension/modules/teacher-support/runtime/support-runtime.js verification/step09
git commit -m "feat: map safe PowerTeacher targets for guidance"
```

---

### Task 4: Add Idempotent Bootstrap and Manifest Activation

**Files:**
- Create: `extension/modules/teacher-support/bootstrap/powerteacher.js`
- Modify: `extension/manifest.json`
- Create: `verification/step09/manifest-bootstrap.test.cjs`
- Update: `verification/step09/evidence-ledger.json`

**Interfaces:**
- Produces `bootstrapPowerTeacherSupport()` and `disposePowerTeacherSupport()`.
- Bootstrap uses global frozen Step 3-8 exports and two new Step 9 factories.
- Manifest loads bootstrap last.

- [ ] **Step 1: Write RED manifest exact-delta tests**

From frozen Step 8 manifest snapshot assert Step 9:
- keeps same PowerTeacher URL match;
- adds no host permission;
- adds no extension permission;
- adds no background/service-worker behavior;
- adds no web-accessible remote resource;
- activates exactly frozen Step 8 UI JS/CSS plus three Step 9 JS integration files;
- introduces no duplicate script/CSS entry.

- [ ] **Step 2: Pin deterministic load-order test**

Required relative order:

```text
existing generic core/platform/pack/content dependencies
-> Step 8 interaction-orchestrator
-> Step 8 entry-button
-> Step 8 assistant-panel
-> Step 8 score-inspector
-> Step 9 runtime-targets
-> Step 9 support-runtime
-> Step 9 bootstrap/powerteacher
```

`teacher-support.css` appears exactly once for same approved PowerTeacher content-script.

Do not reorder unrelated pre-existing scripts.

- [ ] **Step 3: Write RED bootstrap idempotency tests**

Assert:
- unsupported host/path -> no runtime;
- repeated bootstrap -> same single instance;
- bootstrap does not duplicate root/listeners;
- dispose clears instance;
- bootstrap after dispose creates one fresh instance;
- no business logic/selectors in bootstrap.

- [ ] **Step 4: Run RED**

Run: `node --test verification/step09/manifest-bootstrap.test.cjs`

- [ ] **Step 5: Implement minimal bootstrap and manifest activation**

Manifest change is activation only. No new permission/match/version bump.

- [ ] **Step 6: Run GREEN**

Run:
`node --test verification/step09/manifest-bootstrap.test.cjs verification/step09/support-runtime.test.cjs`

- [ ] **Step 7: Run JS syntax checks**

```text
node --check extension/modules/teacher-support/platform/powerteacher/runtime-targets.js
node --check extension/modules/teacher-support/runtime/support-runtime.js
node --check extension/modules/teacher-support/bootstrap/powerteacher.js
```

- [ ] **Step 8: Commit**

```text
git add extension/manifest.json extension/modules/teacher-support/bootstrap/powerteacher.js verification/step09
git commit -m "feat: activate teacher-support runtime on PowerTeacher"
```

**Batch B Gate:** Tasks 3-4 focused suites + syntax PASS. Do not package yet.

---

# Batch C — Epoch Invalidation, Re-entry, Stress and Safety

### Task 5: Add Context Epoch, Scoped Observation, Same-Route Class Invalidation, and Re-entry

**Files:**
- Modify: `extension/modules/teacher-support/runtime/support-runtime.js`
- Create: `verification/step09/epoch-invalidation.test.cjs`
- Create: `verification/step09/route-class-matrix.test.cjs`
- Update: `verification/step09/fake-runtime-env.cjs`
- Update: `verification/step09/evidence-ledger.json`

**Interfaces:**
- Keeps public runtime API unchanged.
- Adds internal monotonically increasing `epoch`.
- Scoped observers consume only `runtimeTargets.readObservationNodes()`.

- [ ] **Step 1: Write RED same-route class-switch test**

Start in eligible class A with `filter.value === "MS1"`.

Simulate class B change while normalized route remains unchanged and filter still contains `MS1`.

Before any fresh class-B academic result can render, assert:
- epoch increments;
- old inspector cleared/ineligible;
- old target hint cleared;
- old selected strand not reused;
- persisted filter value alone does not restore eligibility.

- [ ] **Step 2: Write RED stale deferred-result tests**

Sequence:

```text
epoch 7 begins reconcile
-> context invalidates to epoch 8
-> epoch-7 result returns
```

Assert epoch-7 result discarded and never mutates Step 8 UI.

Repeat for stale:
- academic model;
- target rect;
- protected rect/placement result;
- target hint.

- [ ] **Step 3: Write RED route tests**

Cover:
- `hashchange`;
- `popstate`;
- supported -> unsupported -> supported;
- same normalized route with course semantic change;
- route change that leaves previous DOM temporarily present.

Each semantic-context transition invalidates old academic state.

- [ ] **Step 4: Write RED scoped-observer tests**

Assert:
- never observe `document.body`;
- at most minimal verified course/Standards nodes observed;
- observer callback only calls invalidate;
- multiple mutations in one queue window coalesce;
- replacing observed grid disconnects old observer and binds current node;
- dispose disconnects all observers.

- [ ] **Step 5: Write RED re-entry tests**

Cover:
- open -> close -> reopen;
- route A -> B -> A;
- class A -> B -> A;
- contextual inspector -> invalid state -> eligible new state;
- target present -> disappears -> returns as new current target.

Assert no stale UI/root/listener/observer reuse.

- [ ] **Step 6: Write pairwise route/class/grid matrix tests**

Dimensions:
- route supported/unsupported;
- same-route class switch yes/no;
- filter persisted/cleared;
- rubric/look-alike/mixed header;
- selected valid/none/ambiguous;
- native scale valid/invalid/closed;
- grid stable/replaced;
- target present/missing.

Use deterministic pairwise fixtures, not uncontrolled Cartesian brute force.

- [ ] **Step 7: Run RED**

Run:
`node --test verification/step09/epoch-invalidation.test.cjs verification/step09/route-class-matrix.test.cjs`

- [ ] **Step 8: Implement epoch + scoped observer ownership**

Rules:
- increment epoch on semantic-context invalidation;
- capture epoch at reconcile start;
- compare before every apply step;
- clear transient academic/target state immediately on epoch change;
- observer callback invalidates only;
- one queued reconcile max per coalescing window.

- [ ] **Step 9: Run GREEN**

Run:
`node --test verification/step09/support-runtime.test.cjs verification/step09/epoch-invalidation.test.cjs verification/step09/route-class-matrix.test.cjs`

- [ ] **Step 10: Commit**

```text
git add extension/modules/teacher-support/runtime/support-runtime.js verification/step09
git commit -m "feat: invalidate stale teacher-support context"
```

---

### Task 6: Add Deterministic Soak, Invalidation Storm, Epoch Churn, Target Disappearance, and Static Safety Gates

**Files:**
- Create: `verification/step09/stress-lifecycle.test.cjs`
- Create: `verification/step09/stress-invalidation.test.cjs`
- Create: `verification/step09/stress-epoch.test.cjs`
- Create: `verification/step09/static-safety.test.cjs`
- Update verification helpers only unless a RED test proves a runtime defect.
- Modify three Step 9 runtime files only for test-proven defects.
- Update: `verification/step09/evidence-ledger.json`

**Interfaces:**
- No new product API.
- Stress tests emit compact summaries only.

- [ ] **Step 1: Implement deterministic 500-cycle lifecycle soak**

Cycle mix: start, open, close, reconcile, invalidate, active/passive transition, target hint on/off, dispose/restart.

Required:

```text
root growth = 0
listener growth = 0
observer growth = 0
pending-work growth = 0
orphan target hints = 0
stale retained context = 0
```

- [ ] **Step 2: Implement deterministic 10,000-signal invalidation storm**

Assert:
- reconcile count follows coalescing windows, not raw signal count;
- no recursive render;
- final fingerprint equals last valid state;
- no final state lost;
- idle recurring work remains zero.

Success output contains compact counts only.

- [ ] **Step 3: Implement deterministic 1,000-transition epoch churn**

Include A -> B -> A; same-route class changes; supported/ineligible/unsupported flips; rubric/look-alike flips; selected -> none; delayed old results.

Required:

```text
stale applied = 0
stale inspector = 0
stale target hint = 0
```

- [ ] **Step 4: Implement target-disappearance stress**

Repeatedly:

```text
target exists
-> measure
-> target replaced/removed
-> old geometry tries to return
```

Assert old geometry never resurrects a hint.

- [ ] **Step 5: Write static safety/privacy/performance tests**

Reject:
- native `.click()`;
- `dispatchEvent()`;
- synthetic typing/input;
- Fill/grade/Save/Publish/Send native mutation path;
- `setInterval`;
- recurring RAF;
- recursive polling timeout;
- `MutationObserver(document.body)`;
- network/analytics/telemetry APIs;
- new storage writes;
- raw identifier persistence/logging;
- second root owner;
- placement algorithm duplication;
- broadened manifest permissions/matches.

Scoped `MutationObserver` in `support-runtime.js` is allowed only if tests prove the spec constraints.

- [ ] **Step 6: Run stress/static suite**

```text
node --test verification/step09/stress-lifecycle.test.cjs
node --test verification/step09/stress-invalidation.test.cjs
node --test verification/step09/stress-epoch.test.cjs
node --test verification/step09/static-safety.test.cjs
```

Expected:
- lifecycle cycles: 500;
- invalidation signals: 10000;
- context transitions: 1000;
- all growth/leak/stale counts: 0.

- [ ] **Step 7: If any stress failure occurs, invoke systematic-debugging**

Do not raise limits or weaken assertions.

Persist first failing seed/case and implement minimum causal fix.

- [ ] **Step 8: Run affected focused suites after any fix**

Do not automatically rerun frozen regression until batch green.

- [ ] **Step 9: Commit**

```text
git add verification/step09 extension/modules/teacher-support
git commit -m "test: stress live teacher-support lifecycle"
```

**Batch C Gate:** focused runtime/epoch/matrix/stress/static suites PASS.

---

# Batch D — Frozen Regression, Independent Review, Live Validation, Packaging

### Task 7: Full Engineering Regression, Exact Delta, and Independent Review

**Files:**
- Modify runtime only for persisted RED defects discovered by this gate.
- Create final engineering verification reports in Step 9 verification workspace.
- Update: `verification/step09/evidence-ledger.json`

**Interfaces:**
- No new product API.
- This task decides only ENGINEERING COMPLETE, not live PASS.

- [ ] **Step 1: Run complete Step 9 focused suite once**

```text
powershell -ExecutionPolicy Bypass -File .\verification\step09\run-tests.ps1 -RuntimeRoot <candidate-root> -Suite Step9
```

Record actual pass count; do not predeclare.

- [ ] **Step 2: Replay frozen Step 8 placement/non-obstruction stress**

Required:

```text
placement cases = 10000
unsafe placements = 0
```

If frozen placement solver/UI bytes unchanged and this passes, record dependency hash and do not rerun until package replay unless dependent file changes.

- [ ] **Step 3: Replay all frozen Step 5-8 regression against Step 9 candidate**

Use final frozen verification artifacts from Step 8 handoff.

Expected: all previously frozen suites green. Record actual counts exactly; do not invent a combined number.

- [ ] **Step 4: Run runtime syntax and manifest reference/load-order checks**

- `node --check` every runtime JS;
- parse manifest;
- every listed JS/CSS reference exists;
- bootstrap last among Teacher Support integration files;
- no duplicate injection.

- [ ] **Step 5: Prove exact Step 8 -> Step 9 runtime delta**

Normal result:

```text
added:
  platform/powerteacher/runtime-targets.js
  runtime/support-runtime.js
  bootstrap/powerteacher.js

modified:
  manifest.json only

removed:
  0

all other Step 8 runtime files:
  byte-identical
```

Any other runtime change blocks completion unless reviewed deviation exists.

- [ ] **Step 6: Prove manifest scope delta**

No new permission, broader host/match, network permission, background behavior, or version bump.

- [ ] **Step 7: Run fresh independent whole-Step-9 review**

Reviewer focus:
1. lifecycle ownership/idempotency;
2. epoch/stale-result correctness;
3. same-route class switch;
4. observer/event boundedness;
5. native target/geometry safety;
6. non-obstruction/pointer/focus/scroll;
7. accidental academic recommendation/native action;
8. privacy/data minimization;
9. manifest activation/load order;
10. idle/performance behavior;
11. unauthorized frozen-file drift;
12. quota optimization does not weaken required gates.

Reviewer output:

```text
SPEC COMPLIANCE: PASS | FAIL
CODE QUALITY: PASS | FAIL
CRITICAL:
IMPORTANT:
MINOR:
```

- [ ] **Step 8: Fix Critical/Important findings only through persisted RED tests**

Use one causal fix wave per finding, affected-suite rerun, scoped re-review.

Do not spend quota on unrelated cleanup.

- [ ] **Step 9: Re-run only invalidated final gates**

Use evidence-ledger dependencies.

- [ ] **Step 10: Mark engineering state**

Only when all engineering gates pass:

`STEP 9 ENGINEERING COMPLETE - AWAITING AUTHORIZED LIVE VALIDATION`

- [ ] **Step 11: Commit verification/fixes**

```text
git add verification/step09 extension
git commit -m "test: verify Step 9 live integration candidate"
```

---

### Task 8: Authorized Live PowerTeacher Smoke, Final Package, SHA Inventory, and Handoff

**Artifacts:**
- Create: `STEP_09_R4_PLUS_LIVE_TEACHER_SUPPORT_RUNTIME.zip`
- Create: `STEP_09_VERIFICATION.zip`
- Create: `STEP_09_LIVE_VALIDATION_REPORT.md`
- Create: `STEP_09_R4_PLUS_LIVE_TEACHER_SUPPORT_RUNTIME_HANDOFF.md`
- Create: `STEP_09_FINAL_ARTIFACTS_SHA256.txt`

**Interfaces:**
- Live actions remain teacher/user performed.
- Extension never performs consequential native actions.

- [ ] **Step 1: Build engineering candidate package and re-extract it**

Byte-compare extracted runtime to candidate. Do not label final live PASS yet.

- [ ] **Step 2: Replay package-critical suites against re-extracted candidate**

At minimum:
- Step 9 focused;
- Step 9 stress/static;
- frozen Step 8 placement/non-obstruction;
- frozen Step 5-8 regression;
- syntax/manifest/reference/load-order;
- exact delta.

- [ ] **Step 3: Perform authorized live smoke**

Validate:
1. load/reload candidate extension;
2. open approved PowerTeacher teachers surface;
3. native page loads normally;
4. exactly one Teacher Support entry;
5. open/close/reopen;
6. Guide me step by step;
7. Help me from here;
8. Quick reference;
9. Explain this in eligible/ineligible states;
10. I know already affects Hub only;
11. teacher manually navigates Grading -> Standards;
12. teacher manually shows/uses filter and searches MS1;
13. teacher manually traverses available Standards columns;
14. teacher manually selects an authorized rubric cell where appropriate;
15. contextual inspector appears only on strict eligibility;
16. same-route class switch clears old context;
17. route away/back clears/rebuilds correctly;
18. reload;
19. native pointer/keyboard/focus/scroll remain usable while Hub open;
20. verified spotlight target remains native-clickable;
21. missing/unverified target gives safe non-spotlight fallback;
22. no Step 9-attributable console/runtime error.

- [ ] **Step 4: Record live pass/fail with sanitized evidence**

Required pass values:

```text
runtime owners = 1
Teacher Support roots = 1
entry buttons = 1
duplicate panels/inspectors/hints = 0
stale academic context = 0
unsafe overlap = 0
blocked native click = 0
blocked keyboard/focus = 0
blocked scroll = 0
automatic native actions = 0
runtime errors = 0
```

Do not include identifying data.

- [ ] **Step 5: On live failure, stop final PASS packaging and enter fix loop**

```text
capture minimal sanitized evidence
-> deterministic RED regression
-> systematic-debugging
-> minimum causal fix
-> affected engineering gates
-> repeat failed live scenario
```

No broad refactor.

- [ ] **Step 6: After live PASS, package final runtime and verification ZIPs**

Verify ZIP entry count, CRC/integrity, re-extracted byte equality.

- [ ] **Step 7: Compute final SHA-256 inventory**

Hash final runtime ZIP, verification ZIP, live report, handoff, and included independent-review report.

- [ ] **Step 8: Write complete durable handoff**

Handoff includes:

```text
STATUS
STEP 8 INPUT ARTIFACT + VERIFIED SHA-256
STEP 9 FINAL RUNTIME SHA-256
STEP 9 VERIFICATION SHA-256
EXACT STEP8->STEP9 RUNTIME DELTA
MANIFEST DELTA
STEP 9 FOCUSED TEST RESULT
LIFECYCLE SOAK 500 RESULT
INVALIDATION STORM 10000 RESULT
EPOCH CHURN 1000 RESULT
TARGET-DISAPPEARANCE RESULT
ROUTE/CLASS/GRID MATRIX RESULT
STEP 8 PLACEMENT 10000 / UNSAFE COUNT
FROZEN REGRESSION RESULTS
STATIC SAFETY/PRIVACY RESULT
INDEPENDENT REVIEW RESULT
LIVE POWERTEACHER RESULT
KNOWN LIMITATIONS
RULINGS/DEVIATIONS
ROLLBACK
NEXT STEP
DO NOT REDO
```

- [ ] **Step 9: Final status**

Only after authorized live PASS:

`STEP 9 LIVE RUNTIME INTEGRATION PASS - READY FOR CONVERGENCE REVIEW`

Never claim `PRODUCTION READY`.

- [ ] **Step 10: Stop**

Do not merge, publish, version-bump, or begin convergence/release work without separate authorization.

---

## Codex Low-Quota Execution Contract

### Authority read order

Read once:
1. final Step 8 handoff + final SHA inventory;
2. approved Step 9 spec;
3. this implementation plan.

Load source/test files only for current task.

Do not preload old chats, superseded Step 8 drafts, historical isolated-lab plans, or unrelated R4 files.

### Four execution batches

```text
Batch A: Tasks 1-2
Batch B: Tasks 3-4
Batch C: Tasks 5-6
Batch D: Tasks 7-8
```

Do not create a full handoff between normal tasks. Persist compact task records only.

### Compact progress record

```text
TASK:
COMMIT:
FILES:
TEST:
RESULT:
NEW RISK:
EVIDENCE INVALIDATED:
NEXT:
```

### Evidence reuse

A green gate remains valid while recorded dependency hashes remain unchanged.

Do not rerun merely because an unrelated task completed.

Mandatory exceptions:
- final package replay;
- final live smoke;
- any gate whose dependencies changed.

### Test-cost ladder

```text
single focused test
-> affected focused suite
-> batch gate
-> final full regression
-> package replay
-> live smoke
```

### Stress-output budget

Success: one compact summary per stress family.

Failure: first reproducible failing seed/case plus bounded context only.

Never print all generated cases.

### Agent/reviewer budget

If quota is priority:
- implement Tasks 1-6 sequentially in one execution context;
- use one fresh architecture/safety reviewer at end of Batch C;
- use one strongest fresh whole-Step-9 reviewer in Task 7;
- avoid implementer-per-task + reviewer-per-task unless a high-risk defect justifies escalation.

If maximum independence is priority, use subagent-driven development, with materially higher context/quota cost.

### Reasoning budget

Use Medium for:
- fixtures;
- straightforward RED tests;
- manifest wiring;
- deterministic packaging checks.

Use High only for:
- runtime lifecycle/epoch architecture;
- same-route stale-state failures;
- observer/performance ambiguity;
- native non-obstruction defect;
- repeated unexplained test failure;
- independent final review.

Do not use highest reasoning by default.

### Compaction checkpoint

Before compaction preserve exactly:

```text
BATCH/TASK
CURRENT COMMIT
CHANGED FILES
LAST GREEN TESTS
CURRENT RED FAILURE
STEP 8 VERIFIED INPUT SHA
EVIDENCE LEDGER STATUS
OPEN DEVIATIONS/RISKS
NEXT COMMAND
```

After compaction, resume from checkpoint. Do not restart discovery or reread unchanged authority.

## Definition of Done

Step 9 is done only when:
- exact Step 8 input hash verified;
- normal runtime delta is three new Step 9 files + manifest only;
- sole runtime owner proven;
- one root proven;
- same-route class change invalidates stale academic state;
- stale epoch results never apply;
- native targets verified, not guessed;
- target/placement geometry sanitized and bounded;
- Fill/grade/Save/etc. remain teacher-only;
- no academic recommendation exists;
- no broad observer/polling/recurring work exists;
- idle recurring work is zero;
- 500 lifecycle cycles PASS with zero growth/leak;
- 10,000 invalidation signals PASS;
- 1,000 epoch transitions PASS with zero stale application;
- target disappearance PASS with zero orphan hint;
- route/class/grid pairwise matrix PASS;
- frozen Step 8 placement stress remains 10,000 / 0 unsafe;
- frozen Step 5-8 regression remains green;
- manifest exact scope/load-order gate PASS;
- static privacy/safety/performance gate PASS;
- package re-extraction/replay PASS;
- independent review has no unresolved Critical/Important issue;
- authorized live PowerTeacher smoke PASS;
- final artifacts and SHA inventory exist;
- complete handoff records rollback and next step;
- final status is exactly `STEP 9 LIVE RUNTIME INTEGRATION PASS - READY FOR CONVERGENCE REVIEW`.
