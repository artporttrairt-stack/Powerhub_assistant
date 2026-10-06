# CODEX MASTER INSTRUCTION — HUB ASSISTANT STEP 9 AUTONOMOUS EXECUTION

You are the execution controller for **Hub Assistant Step 9 — Live Runtime Integration**.

Your job is to execute Step 9 from the approved frozen Step 8 checkpoint through the complete engineering gate, and through live validation only when an authorized PowerTeacher session is actually available.

Operate autonomously. Do not stop to ask routine questions. Do not ask “should I continue?” between tasks, batches, tests, fixes, reviews, or compaction. Make reversible technical rulings yourself, record them, and keep going.

You may stop only at the explicit **HUMAN CONTROL GATES** defined below.

---

# 1. EXECUTION MODE

Use **Superpowers executing-plans / inline execution**, not implementer-per-task subagent development.

Reason:
- Tasks 2–6 share `support-runtime.js`, lifecycle state, epoch semantics, native target mapping, and manifest assumptions.
- One continuous implementation context reduces duplicate context loading and quota use.
- Independent review is still mandatory at the load-bearing gates.

Use these Superpowers workflows when available:

1. `using-git-worktrees`
2. `executing-plans`
3. `test-driven-development`
4. `systematic-debugging`
5. `verification-before-completion`
6. `requesting-code-review`

Do NOT invoke `finishing-a-development-branch` to merge/push/publish in Step 9. Step 9 ends at convergence-review readiness.

If a named skill is unavailable, preserve its behavioral contract manually rather than inventing a replacement workflow.

---

# 2. SOURCE OF TRUTH / AUTHORITY ORDER

Read these files from the repository in exactly this precedence:

1. `docs/superpowers/specs/2026-10-06-step-09-live-runtime-integration-design.md`
2. `docs/superpowers/plans/2026-10-06-step-09-live-runtime-integration.md`
3. `docs/superpowers/plans/2026-10-06-step-09-codex-execution-error-detection-playbook.md`
4. `docs/superpowers/plans/2026-10-06-step-09-codex-low-quota-start-here.md`
5. exact final Step 8 runtime artifact
6. exact final Step 8 handoff
7. `STEP_08_FINAL_ARTIFACTS_SHA256.txt`
8. current task RED/GREEN evidence
9. historical docs only when a current authoritative file explicitly requires them

Authority precedence:

```text
APPROVED STEP 9 SPEC
> APPROVED STEP 9 IMPLEMENTATION PLAN
> ERROR-DETECTION PLAYBOOK
> LOW-QUOTA START HERE
> EXACT FROZEN STEP 8 ARTIFACT/HANDOFF
> CURRENT TASK EVIDENCE
> HISTORICAL MATERIAL
```

Historical Step 8 drafts, old chats, old isolated-lab plans, older branches, and memory summaries are not authority.

Do not reread unchanged authority files after initial intake unless their hash or content changes.

---

# 3. CORE MISSION

Implement Step 9 only.

Step 9 connects:

```text
PowerTeacher live page
-> frozen PowerTeacher contract/read-only adapter
-> sanitized semantic snapshot
-> frozen generic resolver/controller
-> frozen CAM Primary MS1 policy/content
-> Step 9 sole support runtime
-> frozen Step 8 generic interaction/placement/UI
```

Step 9 is an **integration/validation step**, not a feature-development step.

Do not:
- redesign UI;
- add teacher-facing goals;
- add new guides;
- change academic policy/content;
- infer a grade;
- automate PowerTeacher actions;
- broaden scope;
- merge/release/publish.

---

# 4. NORMAL RUNTIME DELTA — HARD LOCK

Normal Step 9 runtime changes are exactly:

```text
CREATE extension/modules/teacher-support/platform/powerteacher/runtime-targets.js
CREATE extension/modules/teacher-support/runtime/support-runtime.js
CREATE extension/modules/teacher-support/bootstrap/powerteacher.js
MODIFY extension/manifest.json
```

Verification files under `verification/step09/` may be created/updated as defined in the approved plan.

All other frozen Step 5–8 runtime files stay byte-identical in the normal path.

If safe integration appears to require modifying another frozen runtime file:
- do NOT edit it;
- persist a minimal RED test proving the interface defect;
- document the exact defect and smallest required deviation;
- enter **HUMAN GATE H2 — SPEC/FROZEN-BOUNDARY DEVIATION**.

---

# 5. NON-NEGOTIABLE PRODUCT SAFETY

The extension remains read-only with respect to native PowerTeacher state.

Never:
- call native `.click()`;
- call `dispatchEvent()` to drive native UI;
- synthesize keyboard/input events;
- type into native fields;
- select or write grades;
- execute Fill Down/Across;
- Save;
- Publish;
- Send;
- Undo/Recalculate;
- mutate comments/flags/SIS records;
- add analytics/telemetry/network calls;
- add a backend/CDN/external runtime dependency;
- persist student/teacher/class/person identity;
- persist score/grade/comment/academic judgement;
- persist teacher technical-skill classification;
- log sensitive native text, IDs, cookies, auth or tokens.

Never infer or recommend:
`EE`, `AE`, `ME`, `BE`, or `WB`.

Teacher remains the owner of all consequential native actions.

---

# 6. NATIVE NON-OBSTRUCTION INVARIANT

Hub Assistant must never cover, block, intercept, trap, disable, or materially obstruct native PowerTeacher interaction.

Native:
- mouse;
- touch;
- wheel;
- keyboard;
- focus;
- scrolling

must remain usable while Hub is visible.

If safe placement is impossible:

```text
preferred safe placement
-> alternate safe placement
-> compact
-> collapsed
-> suspend
```

Never choose “least overlap”.

Target hint/spotlight must be:
- extension-owned;
- pointer-transparent;
- non-opaque over native target;
- finite;
- reduced-motion safe;
- removed immediately when target/context becomes stale.

---

# 7. PERFORMANCE INVARIANTS

Do not use:
- `MutationObserver(document.body)`;
- broad full-page observers;
- polling;
- `setInterval`;
- recurring `requestAnimationFrame`;
- recursive timer loops;
- continuous geometry measurement;
- render-on-every-mutation;
- repeated full-document scans.

A scoped `MutationObserver` is allowed only if:
- attached to the smallest verified current course-context or Standards-surface container;
- callback does `invalidate()` only;
- expensive work happens in coalesced reconcile;
- old observer disconnects when container changes;
- all observers disconnect on dispose;
- observer counts are deterministic and bounded.

Idle recurring work must equal zero.

---

# 8. LIFECYCLE / STALE-STATE INVARIANTS

`support-runtime.js` is the sole Teacher Support lifecycle owner.

Required lifecycle states:

```text
STOPPED
OBSERVING
DIRTY
RESOLVING
ACTIVE
PASSIVE
```

Repeated `start()` must remain idempotent.

Repeated `dispose()` must remain harmless.

At active use:
- runtime owners = 1;
- Teacher Support roots = 1.

After dispose:
- runtime-owned listeners = 0;
- connected runtime-owned observers = 0;
- queued runtime reconcile work = 0;
- transient target hint = 0;
- stale semantic context retained for reuse = 0.

Use a monotonically increasing in-memory `epoch`.

Any semantic-context invalidation changes epoch.

Every async/deferred/reconcile result captures starting epoch.

Before any academic/target/placement UI apply:

```text
resultEpoch === currentEpoch
```

must be true.

Otherwise discard.

Same normalized route + different class must invalidate academic state even when the native filter still contains `MS1`.

Route string alone and persisted filter state alone never establish current academic eligibility.

---

# 9. NATIVE TARGET BOUNDARY

Step 8 UI must never receive native selectors or DOM nodes.

Flow:

```text
semantic target key
-> runtime-targets.js
-> verified current native element
-> sanitized numeric rect
-> Step 8 placement/hint API
```

`runtime-targets.js` owns native target/geometry resolution.

Never identify rubric strand by fixed absolute `cellIndex`.

Selected standard mapping must use verified relative semantic standard-column position.

Unknown/hidden/detached/ambiguous/unverified target:
- return null/fail closed;
- explain without spotlight;
- never guess a selector.

---

# 10. REQUIRED RUNTIME PUBLIC INTERFACES

## runtime-targets.js

Expose:

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

Rules:
- target rect = frozen sanitized finite positive numeric rect or null;
- protected rects = frozen sanitized finite positive numeric rect list;
- observation nodes are internal platform/runtime references only;
- no listener/observer ownership in this module;
- no native actions.

## support-runtime.js

Expose:

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

`getDebugState()`:
- read-only;
- deterministic;
- sanitized;
- no sensitive native data;
- may expose phase/epoch/dirty/reconcile/listener/observer counts and semantic fingerprint.

## bootstrap/powerteacher.js

Expose:

```js
HubAssistantTeacherSupport.bootstrapPowerTeacherSupport()
HubAssistantTeacherSupport.disposePowerTeacherSupport()
```

Bootstrap:
- creates at most one runtime;
- starts once;
- contains no business logic;
- contains no selectors;
- is loaded last among Teacher Support runtime files.

---

# 11. MANIFEST RULE

Manifest modification is activation only.

Must preserve:
- exact approved PowerTeacher match boundary;
- permissions;
- host permissions;
- background behavior;
- version;
- unrelated script order.

Allowed change:
- activate frozen Step 8 Teacher Support JS/CSS;
- load Step 9 runtime-targets;
- load Step 9 support-runtime;
- load Step 9 bootstrap last.

No duplicate JS/CSS injection.

---

# 12. MODEL / REASONING ROUTING

Optimize capability and quota.

If these models are available in the Codex environment:

## Default
Use **GPT-5.6 Sol / Medium reasoning** for normal implementation.

Use for:
- Task 1;
- normal Task 3;
- Task 4;
- routine Task 6 harness work;
- deterministic verification;
- packaging/handoff.

## Critical
Use **GPT-6 Astra / High reasoning** for:
- Task 2 lifecycle/reconcile architecture;
- Task 5 epoch/scoped-observer/stale-state integration;
- actual stale-state/race/order/lifecycle duplication bugs;
- native non-obstruction bugs;
- stress failures whose cause is not immediately local;
- mandatory Batch C architecture/safety review;
- Task 7 final whole-Step-9 review.

If model switching is not available:
- keep current capable model;
- raise reasoning only for the critical tasks above.
If Astra is unavailable:
- use GPT-5.6 Sol / High.

Do not block execution merely because a preferred model is unavailable.

Do not use maximum reasoning for mechanical steps.

---

# 13. CHAT / TOKEN BUDGET — IMPORTANT

Keep conversation output minimal so execution context is spent on code and evidence.

Do NOT print:
- hidden chain-of-thought;
- long reasoning narratives;
- full specs after reading them;
- full test logs when green;
- thousands of generated stress cases;
- repeated project summaries;
- complete handoffs after every task.

Normal chat updates:
- one short line at start;
- one short line at each batch boundary;
- immediate short notice for a real blocker/human gate;
- final handoff summary.

Store durable state in files/ledger, not chat.

For a passing command, record compactly:

```text
COMMAND
EXIT
PASS/FAIL COUNT
KEY METRIC
```

For a failing command, capture:
- first relevant error;
- first reproducible case;
- bounded surrounding context only.

Stress PASS output must be summaries only.

Example:

```text
lifecycle=500 failures=0 growth=0
invalidations=10000 reconciles=37 stale=0
epochs=1000 staleApplied=0
placement=10000 unsafe=0
```

---

# 14. DURABLE EXECUTION LEDGER

Create/use the Superpowers plan workspace ledger if available.

The ledger must survive context compaction.

Identity:

```text
# SDD ledger — plan: docs/superpowers/plans/2026-10-06-step-09-live-runtime-integration.md
```

Also maintain:
`verification/step09/evidence-ledger.json`

For every completed task record only:

```text
Task N
BASE
HEAD
FILES
RED
GREEN
INVARIANTS
NEW RISK
EVIDENCE INVALIDATED
NEXT
```

For every autonomous decision not explicit in spec/plan:

```text
Ruling: <decision> — <reason> — <cost if wrong>
```

Do not make silent architecture decisions.

---

# 15. WORKTREE / BASELINE SETUP

First determine whether already in an isolated worktree.

If already isolated:
- use it.

If not isolated:
- use the platform's native worktree mechanism if available;
- otherwise use a safe git worktree if repository policy permits.

Do not implement on `main`/`master`.

If the only possible workspace would require modifying a shared/main branch:
enter **HUMAN GATE H1**.

After workspace setup:
- inspect branch and HEAD;
- inspect dirty status;
- do not erase unrelated changes.

Do not run destructive cleanup such as `git clean -fdx` against user work.

---

# 16. STEP 8 BASELINE FREEZE — MUST HAPPEN BEFORE CODE

Locate:
- exact final Step 8 runtime artifact;
- exact final Step 8 handoff;
- exact `STEP_08_FINAL_ARTIFACTS_SHA256.txt`.

Read only these final Step 8 authority artifacts, not old drafts.

Recompute runtime ZIP SHA-256.

Require exact equality with the final inventory.

Extract and inventory:
- all runtime paths;
- per-file hashes;
- Step 8 manifest snapshot.

Verify:
- five Step 8 UI files exist;
- no Step 9 runtime files already exist in the frozen input.

If final Step 8 artifact or hash cannot be verified:
enter **HUMAN GATE H1**.

Do NOT substitute:
- “latest folder”;
- older Step 8 package;
- repo reconstruction;
- isolated-lab output;
- inferred checksum.

---

# 17. PRE-FLIGHT INTERFACE SCAN

Before Task 1 implementation, scan shared task interfaces.

Record rows at minimum:

```text
Task2 -> Task3 : support-runtime/runtimeTargets
Task2 -> Task5 : lifecycle/epoch/reconcile
Task3 -> Task5 : observation nodes
Task3 -> Step8 : sanitized geometry boundary
Task4 -> runtime: manifest load order
Task5 -> Task6 : debug counters/epoch observability
Task6 -> Task7 : stress evidence
```

Check:
- producer signature matches consumer;
- planned file ownership is consistent;
- no task contradicts Global Constraints;
- no hidden frozen-file dependency.

Resolve reversible ambiguities using spec and record a Ruling.

Do not stop unless every safe path would require guessing/spec deviation.

---

# 18. UNIVERSAL TASK LOOP — RED/GREEN + ERROR DETECTION

For every code-changing task:

## A. Record task BASE

```text
TASK_BASE = git rev-parse HEAD
```

Inspect:
- `git status`;
- diff;
- unexpected dirty files.

Do not overwrite unrelated work.

## B. Write smallest RED first

No production behavior change before a failing test.

RED must fail for the intended reason.

Record:

```text
RED_TEST
EXPECTED_FAILURE
ACTUAL_FAILURE
MATCH=YES|NO
```

If `MATCH=NO`:
- repair test/harness;
- rerun until failure correctly proves missing behavior.

## C. Minimal GREEN implementation

One causal behavior only.

No unrelated cleanup/refactor.

## D. Focused verification

Run:
1. exact RED test;
2. affected focused suite.

Read output and exit code.

## E. Local invariant scan

Check forbidden primitives relevant to task.

## F. Diff review

Inspect actual diff.

Verify:
- only planned files;
- no frozen drift;
- no duplicated business/placement/academic policy;
- no sensitive logging;
- no test weakened to obtain green.

## G. Commit

One task-oriented local commit.

Do not push.

## H. Update ledgers

Then continue automatically to next task/batch.

---

# 19. FAILURE CLASSIFICATION BEFORE ANY FIX

Every failure gets one primary class:

```text
F1 baseline/environment
F2 test harness
F3 contract/interface
F4 implementation logic
F5 lifecycle/stale-state
F6 native obstruction/safety
F7 manifest/load-order
F8 performance/stress
F9 live-only
```

Do not patch before classification.

---

# 20. SYSTEMATIC DEBUGGING — NO GUESS FIXES

For every real failure:

## Phase 1 — evidence

Capture:
- exact command;
- first failing assertion/error;
- stack;
- last known green commit;
- changed files since green;
- seed/case if stress.

## Phase 2 — minimal reproduction

Reduce:
- suite -> one test;
- stress -> one case/seed;
- transition sequence -> shortest failing sequence;
- live issue -> sanitized deterministic fixture when possible.

## Phase 3 — boundary trace

Trace:

```text
native event
-> invalidate reason
-> epoch
-> queued reconcile
-> adapter snapshot
-> controller decision
-> semantic fingerprint
-> runtimeTargets
-> placement
-> UI apply
```

Find the first incorrect boundary.

## Phase 4 — one hypothesis

Record:

```text
HYPOTHESIS: I think X because Y.
PREDICTION: If true, minimal test Z will show W.
```

## Phase 5 — minimal experiment

One variable.

If prediction fails:
- reject hypothesis;
- return to evidence;
- do not stack speculative changes.

## Phase 6 — persist RED regression

Required before final bug fix when technically possible.

## Phase 7 — one causal fix

Fix root cause only.

## Phase 8 — affected verification

Run:
1. persisted regression;
2. affected focused suite;
3. only invalidated broader gates.

---

# 21. THREE-STRIKE ARCHITECTURE BREAKER

For one root problem:

- failed causal fix 1 -> reinvestigate;
- failed causal fix 2 -> reinvestigate from boundary evidence;
- failed causal fix 3 -> stop local patching.

After 3 failed materially different fixes:
- escalate reasoning/model;
- perform architecture review against approved spec;
- record `ARCH_BREAKER`.

If a safe resolution exists without changing approved boundaries:
- make a Ruling;
- persist RED;
- continue.

If resolution requires spec/frozen-boundary change or every path is a guess:
enter **HUMAN GATE H2/H5**.

Never attempt speculative Fix #4.

---

# 22. TASK/BATCH EXECUTION

Execute the approved implementation plan exactly as:

```text
Batch A
Task 1 — frozen authority/evidence
Task 2 — sole runtime lifecycle

Batch B
Task 3 — native targets/sanitized geometry
Task 4 — bootstrap/manifest activation

Batch C
Task 5 — epoch/invalidation/re-entry/scoped observers
Task 6 — deterministic stress/static safety

Batch D
Task 7 — full engineering regression + independent review
Task 8 — authorized live validation + final package/handoff
```

Do not pause between normal tasks.

---

# 23. TASK 1 SPECIAL RULES

Recommended: Sol Medium.

Verify Step 8 hash first.

Create:
- Step 9 authority test;
- evidence ledger;
- runner.

Hard failure:
- hash/inventory mismatch.

Do not touch runtime in Task 1.

Do not rerun old unrelated historical tests.

---

# 24. TASK 2 SPECIAL RULES

Recommended: Astra High or Sol High if Astra unavailable.

Before product code, tests must pin:

```text
initial STOPPED
start x3 -> one lifecycle/listener set
dispose x3 -> zero Step9 runtime resources
100 invalidates in one queue window -> one scheduled reconcile
adapter throw -> safe PASSIVE/clear transient state
ambiguous/unverified -> no academic render
supported -> ACTIVE
one primary semantic snapshot per reconcile
idle recurring work = 0
debug state sanitized
```

Allow a bounded test/debug transition trace, semantic labels only.

Example:

```text
START
INVALIDATE:hashchange
RECONCILE_BEGIN:e4
SNAPSHOT:e4
APPLY_ACTIVE:e4
RECONCILE_END:e4
```

Never include native identifying data.

Do not put selectors/academic content/placement algorithm in runtime.

---

# 25. TASK 3 SPECIAL RULES

Recommended: Sol Medium; escalate on genuine semantic ambiguity.

Tests must cover:
- visible verified target;
- hidden target;
- detached target;
- malformed rect;
- zero rect;
- multiple selected cells;
- no selected cell;
- look-alike current column;
- leading non-standard columns;
- stale previous-grid node;
- protected-rect duplicates;
- large bounded protected set;
- missing observation node.

Every returned rect:
- finite;
- positive width/height.

No DOM node crosses into Step 8 pure UI/placement boundary.

No fixed absolute cell index.

---

# 26. TASK 4 SPECIAL RULES

Recommended: Sol Medium.

Structural manifest diff must prove unchanged:
- matches;
- permissions;
- host permissions;
- background;
- version;
- unrelated scripts.

Only approved Teacher Support JS/CSS activation/order differs.

Use a browser-like load-order harness.

Assert globals exist before consumers load.

Assert bootstrap executes at most once.

---

# 27. TASK 5 SPECIAL RULES

Recommended: Astra High.

Mandatory transition cases:

```text
eligible A -> same-route B
A -> unsupported -> A
rubric -> look-alike
selected -> none
grid1 -> grid2, same route
target1 measured -> removed -> old result returns
```

For every academic/target apply:

```text
applyEpoch === currentEpoch
```

must hold.

Observer diagnostics in test/debug state:

```text
observerCreateCount
observerDisconnectCount
activeObserverCount
mutationCallbackCount
```

After dispose:
`activeObserverCount = 0`.

Persisted `MS1` filter never restores eligibility by itself.

---

# 28. TASK 6 SPECIAL RULES

Recommended: Sol Medium for harness; Astra High only for non-local failure diagnosis.

Required deterministic tests:

```text
500 lifecycle cycles
10,000 invalidation signals
1,000 context transitions
target-disappearance stress
route/class/grid pairwise matrix
```

Required zeroes:

```text
root growth = 0
listener growth = 0
observer growth = 0
pending-work growth = 0
orphan hint = 0
stale academic apply = 0
stale target hint = 0
```

Stress runner:
- fixed seed;
- compact success output;
- on failure save first reproducible failing seed/case;
- never print all cases.

Do not weaken thresholds/counts to obtain green.

---

# 29. MANDATORY REVIEW AFTER BATCH C

After Tasks 1–6 are green:
request one fresh architecture/safety review.

Recommended reviewer:
**GPT-6 Astra High**, or strongest available model/high reasoning.

Review input:
- approved spec;
- approved plan;
- diff from Step 8 frozen baseline to current HEAD;
- evidence ledger;
- stress summaries;
- rulings/deviations only.

Do not paste entire session history.

Reviewer must return:

```text
SPEC COMPLIANCE: PASS|FAIL
CODE QUALITY: PASS|FAIL
CRITICAL:
IMPORTANT:
MINOR:
TEST GAPS:
ARCHITECTURE DRIFT:
```

Review focus:
1. sole lifecycle owner;
2. idempotency;
3. epoch/stale-result safety;
4. same-route class change;
5. bounded observers/events;
6. target/geometry correctness;
7. DOM/selector leakage;
8. native non-obstruction;
9. accidental native action;
10. academic recommendation leakage;
11. privacy/data minimization;
12. performance/idle behavior;
13. manifest activation;
14. frozen-file drift.

Critical/Important:
- persist RED;
- one causal fix wave;
- affected tests;
- scoped re-review.

Do not create per-finding agents.

Minor:
- ledger unless it blocks acceptance.

---

# 30. EVIDENCE INVALIDATION / QUOTA CONTROL

A green gate remains valid while its dependencies remain unchanged.

Track:

```text
gate
dependency hashes
result
stillValid
rerunRequired
```

Examples:

`runtime-targets` tests depend on:
- runtime-targets.js;
- relevant platform contract fixture;
- geometry helper.

`manifest` tests depend on:
- manifest.json;
- bootstrap load contract.

Step 8 placement 10k depends on:
- frozen Step 8 placement solver;
- geometry semantic contract.

Frozen academic regression depends on:
- frozen content/policy.

When a dependency changes:
- invalidate only dependent evidence.

Do not rerun broad suites after unrelated changes.

Mandatory broad replays:
- final engineering gate;
- re-extracted final package;
- after a dependent critical fix.

---

# 31. TASK 7 FINAL ENGINEERING GATE

Recommended:
- controller/running commands: Sol Medium;
- whole-branch reviewer: Astra High.

Run in fail-fast order:

```text
1 syntax
2 static safety/privacy
3 manifest exact delta
4 runtime exact delta
5 Step 9 focused
6 lifecycle/epoch/matrix
7 stress
8 frozen Step 8 placement 10k
9 frozen Step 5–8 regression
10 package/re-extract replay
```

Reason: cheap high-signal failures should abort expensive later gates.

Required final engineering evidence:

```text
Step9 focused = PASS
lifecycle 500 = PASS
invalidations 10000 = PASS
epoch transitions 1000 = PASS
target disappearance = PASS
route/class/grid matrix = PASS
Step8 placement 10000; unsafe = 0
frozen Step5–8 regression = PASS
syntax = PASS
static safety/privacy/performance = PASS
manifest exact scope/load order = PASS
runtime exact delta = PASS
independent review = no unresolved Critical/Important
```

Do not invent test counts; record actual output.

Before claiming engineering complete, invoke/obey verification-before-completion:
- run fresh proving commands;
- read output;
- inspect exit status;
- only then state:

`STEP 9 ENGINEERING COMPLETE - AWAITING AUTHORIZED LIVE VALIDATION`

---

# 32. TASK 8 LIVE VALIDATION

If Codex has an explicitly authorized live browser/session with PowerTeacher access and the required teacher actions can be performed without violating read-only/native-action restrictions, proceed with the approved live checklist.

If not, enter **HUMAN GATE H4 — AUTHORIZED LIVE VALIDATION REQUIRED** after engineering completion.

Do NOT:
- ask for credentials in chat;
- bypass authentication;
- automate consequential teacher actions;
- claim live PASS from deterministic tests.

Live actions that change native context are manual/authorized.

Minimum live scenarios:
1. load/reload candidate;
2. native page normal;
3. one entry button;
4. open/close/reopen;
5. Guide me step by step;
6. Help me from here;
7. Quick reference;
8. Explain this eligible/ineligible;
9. I know already affects Hub only;
10. teacher manually navigates Grading -> Standards;
11. teacher manually opens/uses filter and searches MS1;
12. traverse Standards columns;
13. authorized manual rubric cell selection;
14. inspector only under strict eligibility;
15. same-route class switch clears old context;
16. route away/back;
17. reload;
18. native pointer/keyboard/focus/scroll usable;
19. spotlight keeps target native-clickable;
20. unverified target -> safe no-spotlight fallback;
21. no Step9-attributable runtime error.

Live pass invariants:

```text
runtime owners = 1
roots = 1
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

Use sanitized evidence only.

---

# 33. LIVE FAILURE FLOW

If live validation fails:

1. capture minimal sanitized scenario;
2. classify F9;
3. reproduce deterministically if possible;
4. persist RED;
5. root-cause trace;
6. minimum causal fix;
7. rerun only invalidated engineering gates;
8. repeat exact failed live scenario.

Do not broad-refactor from live symptoms.

If deterministic reproduction cannot be constructed:
- add only the narrowest safe diagnostic;
- do not guess.

If the remaining evidence requires a human-specific reproduction that Codex cannot access:
enter HUMAN GATE H4 with exact steps and requested evidence.

---

# 34. FINAL PACKAGING

After authorized live PASS only:

Create:

```text
STEP_09_R4_PLUS_LIVE_TEACHER_SUPPORT_RUNTIME.zip
STEP_09_VERIFICATION.zip
STEP_09_LIVE_VALIDATION_REPORT.md
STEP_09_R4_PLUS_LIVE_TEACHER_SUPPORT_RUNTIME_HANDOFF.md
STEP_09_FINAL_ARTIFACTS_SHA256.txt
```

Package complete runtime, not patch.

Then:
1. re-extract;
2. byte-compare;
3. rerun required package-critical tests;
4. validate archive integrity;
5. compute SHA-256;
6. write final handoff.

No Store release.

No merge.

No push unless separately authorized.

---

# 35. FINAL HANDOFF CONTRACT

Final handoff must contain:

```text
STATUS
SOURCE BRANCH / HEAD
STEP 8 INPUT ARTIFACT
STEP 8 VERIFIED SHA-256
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
SYNTAX RESULT
STATIC SAFETY/PRIVACY/PERFORMANCE RESULT
BATCH C REVIEW RESULT
FINAL WHOLE-BRANCH REVIEW RESULT
LIVE POWERTEACHER RESULT
KNOWN LIMITATIONS
RULINGS MADE
DEVIATIONS
ROLLBACK
EXACT NEXT STEP
DO NOT REDO
```

Every ledger `Ruling:` must appear in the final handoff.

Rollback:
- exact verified Step 8 runtime artifact;
- exact verified Step 8 SHA.

---

# 36. HUMAN CONTROL GATES — THE ONLY NORMAL REASONS TO STOP

## H1 — SOURCE / WORKSPACE AUTHORITY CANNOT BE SAFELY ESTABLISHED

Stop if:
- exact final Step 8 artifact/hash cannot be verified;
- current workspace cannot be isolated without touching protected/shared main;
- conflicting source artifacts leave no authoritative baseline.

Return:
- what is missing/conflicting;
- evidence;
- exact one action needed from human.

Do not substitute a baseline.

## H2 — APPROVED SPEC / FROZEN BOUNDARY MUST CHANGE

Stop if a persisted RED proves safe Step 9 integration requires:
- modifying a frozen Step 5–8 runtime file outside approved manifest delta;
- changing public contract/spec;
- broadening manifest permissions/matches;
- changing academic policy.

Return:
- RED evidence;
- root cause;
- minimum proposed deviation;
- risk;
- affected gates.

Do not implement deviation before approval.

## H3 — EXTERNAL / DESTRUCTIVE / SECURITY-SENSITIVE SIDE EFFECT

Stop before:
- push to shared remote if not explicitly pre-authorized;
- merge;
- publish/release;
- Store submission;
- destructive reset/cleanup affecting user work;
- changing credentials/secrets/access;
- security-sensitive action.

Local reversible commits inside isolated worktree are allowed.

## H4 — AUTHORIZED LIVE HUMAN POWERTEACHER ACTION REQUIRED

Stop when engineering is complete but live validation requires:
- logged-in human session unavailable to Codex;
- teacher-only manual navigation/selection;
- user reproduction/evidence Codex cannot legally/safely generate.

Return:
- engineering status;
- candidate package/hash;
- exact live checklist;
- exact expected PASS evidence;
- no request for credentials.

## H5 — ARCHITECTURE BREAKER / NO SAFE NON-GUESS PATH

Stop only after:
- three materially different causal fix attempts failed for same root issue;
- architecture review completed;
- approved spec/plan no longer determines a safe path;
- every remaining path is a guess or requires boundary change.

Return:
- failure history;
- evidence;
- architectural alternatives;
- recommended smallest decision.

Do not stop merely because a task is difficult.

---

# 37. THINGS THAT ARE NOT HUMAN GATES

Do NOT stop for:
- normal test failure;
- one or two failed bug-fix hypotheses;
- formatting issue;
- fixture bug;
- missing test helper;
- simple manifest load-order bug within approved scope;
- scoped observer implementation difficulty;
- stress failure with reproducible case;
- review Minor finding;
- compaction;
- quota pressure while required state is still recoverable;
- need to rerun an affected suite.

Handle these autonomously.

---

# 38. COMPACTION / CONTEXT RECOVERY

Before context compaction write a recovery checkpoint:

```text
PLAN
SPEC
BATCH
TASK
TASK_BASE
HEAD
FILES_CHANGED
LAST_GREEN
CURRENT_RED
FAILURE_CLASS
ROOT_CAUSE_STATUS
FIX_ATTEMPTS
STEP8_VERIFIED_SHA
EVIDENCE_LEDGER_STATUS
OPEN_FINDINGS
RULINGS
NEXT_COMMAND
```

After compaction:
1. read only recovery checkpoint + ledger;
2. verify `HEAD`;
3. trust git history over memory;
4. resume `NEXT_COMMAND`;
5. do not redo complete tasks;
6. do not reread unchanged authority;
7. do not rerun still-valid gates.

---

# 39. FINAL STATUS RULES

If engineering complete but human live gate pending:

`STEP 9 ENGINEERING COMPLETE - AWAITING AUTHORIZED LIVE VALIDATION`

Only after actual authorized live PASS:

`STEP 9 LIVE RUNTIME INTEGRATION PASS - READY FOR CONVERGENCE REVIEW`

Never claim:

`PRODUCTION READY`

Do not start convergence/merge/release work without a new instruction.

---

# 40. START NOW

Immediately:

1. identify repository/worktree/branch/HEAD;
2. load the Superpowers execution/TDD/debug/verification workflows;
3. read the four Step 9 authority documents once;
4. locate and hash-verify exact final Step 8 artifact;
5. create/resume durable execution ledger;
6. run preflight interface scan;
7. start Task 1;
8. continue autonomously through all non-human gates;
9. use concise chat updates only at batch boundaries or human gates;
10. produce final durable handoff before stopping.

Do not ask for confirmation to begin.
Do not ask for permission between Tasks 1–8.
Do not spend chat tokens narrating routine reasoning.
Use files, tests, commits, ledger, and compact evidence as the execution record.
