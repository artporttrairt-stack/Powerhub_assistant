# STEP 9 — Codex Execution + Error-Detection Playbook

**Purpose:** Operational controller plan for executing the approved Step 9 specification and implementation plan with fast fault detection, systematic debugging, bounded reviews, durable recovery, and quota-aware model selection.

**Authority:** This playbook explains HOW to execute. It cannot weaken:
1. `docs/superpowers/specs/2026-10-06-step-09-live-runtime-integration-design.md`
2. `docs/superpowers/plans/2026-10-06-step-09-live-runtime-integration.md`
3. the exact final Step 8 artifact + handoff + SHA inventory.

If this playbook conflicts with the spec or implementation plan, the spec/plan wins.

---

# 0. Recommended execution mode

Use **Native / single-controller execution for Tasks 1-6**, with strategic fresh reviewers:

- one fresh architecture/safety reviewer after Batch C;
- one strongest fresh whole-Step-9 reviewer in Task 7;
- one additional strong debugging agent only when an escalation trigger fires.

Reason:
- Tasks 2-6 share `support-runtime.js`, lifecycle state, epoch semantics, target mapping, and manifest assumptions;
- keeping one implementation context reduces context reload, duplicate investigation, and quota waste;
- fresh reviewers still provide independent error detection at the two load-bearing gates.

Do NOT use one fresh implementer + one reviewer for every small task unless the user explicitly chooses maximum-independence mode.

---

# 1. Model selection

## Default model

Use **GPT-5.6 Sol, Medium reasoning** as the default Codex model for implementation.

Use it for:
- Task 1 authority/evidence harness;
- most Task 3 target mapping work;
- Task 4 manifest/bootstrap;
- routine Task 6 stress-harness implementation;
- packaging/checksum/report generation in Task 8.

Why:
- strong enough for multi-file coding;
- materially more quota-efficient than spending Astra on mechanical steps;
- plan/spec already carry architecture decisions.

## High-risk model

Use **GPT-6 Astra, High reasoning** for:
- Task 2 lifecycle architecture;
- Task 5 epoch/stale-state/scoped-observer integration;
- debugging any failure involving stale state, race/order, lifecycle duplication, native obstruction, or unexplained regression;
- architecture/safety review after Batch C;
- Task 7 whole-Step-9 final review.

Do not use Astra for repetitive fixture generation, checksums, ZIP inspection, or simple manifest edits.

## Optional lower-cost model

If available and quota is tight, **GPT-5.6 Terra, Medium** may be used only for:
- deterministic fixture creation;
- simple static-scan test additions;
- packaging scripts;
- report formatting;
- evidence-ledger maintenance.

Do NOT use Terra as the owner of:
- lifecycle state machine;
- epoch logic;
- observer rebinding;
- native target semantics;
- final architecture review.

## Avoid

Do not intentionally use the fastest/economy model for runtime integration or review.

Fast/cheap models are acceptable only for trivial text/file bookkeeping where no code judgment is needed.

---

# 2. Controller setup before Task 1

Create/verify isolated worktree.

Never implement directly on `main`.

Record:

```text
PLAN
SPEC
BRANCH
WORKTREE
BASE_COMMIT
STEP8_ARTIFACT
STEP8_EXPECTED_SHA
CURRENT_HEAD
```

Create a durable progress ledger.

Recommended identity:

```text
# Step 9 execution ledger
PLAN: docs/superpowers/plans/2026-10-06-step-09-live-runtime-integration.md
```

Ledger is authoritative after compaction.

Before code:
1. read spec once;
2. read implementation plan once;
3. read final Step 8 handoff + SHA inventory once;
4. verify Step 8 artifact hash;
5. record authority hashes;
6. do not reread unchanged historical docs.

---

# 3. Preflight conflict scan

Before Task 1 implementation, scan the plan for shared files/interfaces.

Mandatory rows:

| Producer | Consumer | Shared interface/file | Expected contract |
| --- | --- | --- | --- |
| Task 2 | Task 3 | `support-runtime.js` / runtimeTargets | fake target API replaced without lifecycle rewrite |
| Task 2 | Task 5 | epoch/reconcile lifecycle | public runtime API unchanged |
| Task 3 | Task 5 | observation nodes | minimal verified nodes only |
| Task 3 | Step 8 UI | geometry | sanitized numbers only |
| Task 4 | all runtime | manifest load order | bootstrap last |
| Task 5 | Task 6 | debug counters/epoch state | deterministic stress-observable state |
| Task 6 | Task 7 | stress evidence | compact, reproducible, dependency-hashed |

If conflict found:
- rule against approved spec;
- record ruling in ledger;
- do not improvise silently.

---

# 4. Error-detection protocol used on EVERY coding task

Each task follows the same eight gates.

## Gate A — Scope diff before edit

Before editing:

```text
git status
git diff --stat
git diff --name-only <task-base>..HEAD
```

Confirm no unexpected dirty files.

If unexpected file exists:
- classify it;
- do not overwrite;
- stop only if ownership is ambiguous/destructive.

## Gate B — RED must prove the missing behavior

Write the smallest failing test first.

RED is valid only if it fails for the intended reason.

Invalid RED examples:
- syntax error in test;
- missing fixture;
- wrong path;
- unrelated baseline failure;
- assertion not reaching the target behavior.

Record:

```text
RED_TEST
EXPECTED_FAILURE
ACTUAL_FAILURE
MATCH = YES/NO
```

If `MATCH=NO`, fix the test/harness before product code.

## Gate C — One causal implementation change

Implement the minimum code that should make the RED pass.

No:
- cleanup refactor;
- naming sweep;
- unrelated formatting;
- adjacent “nice to have” change.

## Gate D — Focused GREEN

Run the exact failing test first.

Then run its affected focused suite.

Do not run broad regression yet.

Record:
- command;
- pass count;
- changed files.

## Gate E — Invariant scan

After GREEN, run task-local forbidden-pattern checks.

Examples:
- no native `.click()`;
- no dispatchEvent;
- no new storage/network;
- no selector leakage;
- no second lifecycle owner;
- no fixed absolute cell index;
- no body observer.

## Gate F — Diff review before commit

Inspect actual diff, not just tests.

Questions:
1. Did code touch only planned files?
2. Is any frozen file changed?
3. Did implementation solve only the RED?
4. Is there duplicated policy?
5. Did test accidentally encode implementation detail rather than behavior?
6. Did debug logging leak native data?

## Gate G — Commit

One task-oriented commit.

Do not mix multiple unresolved tasks in one commit.

## Gate H — Update ledger

Compact record only:

```text
TASK
BASE
HEAD
FILES
RED
GREEN
INVARIANTS
RISKS
EVIDENCE_INVALIDATED
NEXT
```

---

# 5. Failure classifier

When anything fails, classify BEFORE fixing.

Use exactly one primary class:

## F1 — Baseline / environment failure

Examples:
- Step 8 SHA mismatch;
- missing verification ZIP;
- wrong Node version;
- wrong working directory;
- test file cannot load known baseline.

Action:
- do not edit runtime;
- repair environment/input only;
- reverify baseline.

## F2 — Test harness failure

Examples:
- fake DOM cannot model required selector;
- test crashes before assertion;
- fixture contains impossible state.

Action:
- fix harness;
- prove intended RED;
- no product change yet.

## F3 — Contract/interface failure

Examples:
- Step 8 UI API differs from assumed signature;
- controller export not what plan expected;
- frozen adapter lacks needed safe interface.

Action:
- inspect exact frozen interface;
- persist RED proving incompatibility;
- if frozen file must change, trigger **SPEC-DEVIATION GATE** before edit.

## F4 — Implementation logic failure

Examples:
- runtime phase wrong;
- coalescing count wrong;
- target rect malformed.

Action:
- systematic debugging;
- minimal causal fix.

## F5 — Lifecycle/stale-state failure

Examples:
- duplicate listeners;
- old inspector survives class change;
- epoch 7 result applies in epoch 8;
- old observer still connected.

Action:
- escalate to GPT-6 Astra High;
- trace state transition/event order;
- do not patch symptom.

## F6 — Native-obstruction/safety failure

Examples:
- Hub overlaps Save;
- target hint intercepts click;
- focus cannot return;
- page scroll blocked.

Action:
- Critical;
- Astra High;
- persisted RED before fix;
- rerun non-obstruction + affected placement tests.

## F7 — Manifest/load-order failure

Examples:
- bootstrap executes before dependency;
- duplicate injection;
- new permission appears.

Action:
- compare Step 8 manifest snapshot;
- minimal manifest correction only.

## F8 — Performance/stress failure

Examples:
- reconcile count scales with 10,000 signals;
- observer/listener count grows;
- idle recurring callbacks exist.

Action:
- inspect counters and event flow;
- find source of repeated scheduling;
- do not weaken stress thresholds.

## F9 — Live-only failure

Examples:
- deterministic tests pass but PowerTeacher DOM behaves differently.

Action:
- capture sanitized live evidence;
- reduce to deterministic RED fixture;
- fix only after reproduction exists where possible.

---

# 6. Systematic debugging loop

For every real bug:

## Phase 1 — Evidence

Record:
- exact failing command;
- first failing assertion;
- stack trace;
- last known green commit;
- files changed since green;
- deterministic seed/case if stress.

Do NOT propose a fix yet.

## Phase 2 — Reproduce minimally

Reduce from:
- full suite -> one test;
- stress -> one seed/case;
- live bug -> sanitized fixture;
- multiple transitions -> shortest event sequence.

## Phase 3 — Trace boundary

For Step 9, inspect data at each boundary:

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

Find the FIRST boundary where actual diverges from expected.

## Phase 4 — Hypothesis

Write exactly:

```text
HYPOTHESIS:
I think <root cause> because <evidence>.
PREDICTION:
If true, <minimal test/change> will produce <result>.
```

## Phase 5 — Minimal test

Change one variable.

If prediction fails:
- reject hypothesis;
- return to evidence;
- do not stack a second speculative fix.

## Phase 6 — Persist RED

Before final fix, persist automated regression when technically possible.

## Phase 7 — Fix root cause

One causal code change.

## Phase 8 — Verify

Run:
1. regression test;
2. affected suite;
3. only dependency-invalidated gates.

---

# 7. Three-strike architecture breaker

Track fix attempts per root problem.

After:
- attempt 1 fails -> re-investigate;
- attempt 2 fails -> re-investigate from boundary evidence;
- attempt 3 fails -> STOP local patching.

At three failed materially different fixes:
- escalate to GPT-6 Astra High;
- review architecture against spec;
- determine whether contract/design is wrong;
- do not attempt Fix #4 as another patch.

Record:

```text
ARCH_BREAKER:
problem
attempts
evidence
architecture question
ruling
```

---

# 8. Batch A — Tasks 1-2

## Task 1 model

**GPT-5.6 Sol Medium**.

Reason:
- mostly deterministic evidence/hash harness;
- no architecture judgment unless baseline differs.

### Extra fault-detection gates

Before GREEN:
- recompute SHA independently;
- compare archive inventory twice: source extraction vs normalized inventory;
- ensure evidence ledger never stores raw sensitive native data.

### Hard stop

If Step 8 final hash does not match:
- do not continue;
- do not “use latest folder” as replacement;
- do not reconstruct Step 8 from repo.

---

## Task 2 model

**GPT-6 Astra High** recommended.

This is the highest-risk implementation task because every later task depends on lifecycle semantics.

### Required error-detection tests before implementation

Pin:
- start x3 -> one listener set;
- dispose x3 -> zero owned runtime resources;
- invalidate x100 in one queue window -> one scheduled reconcile;
- adapter throw -> PASSIVE/cleared transient UI;
- controller ambiguous -> no academic render;
- one adapter snapshot per reconcile;
- no recurring idle queue;
- `getDebugState()` sanitized.

### Additional transition trace

In test-only debug state, expose compact event history capped to a small fixed number, e.g.:

```text
START
INVALIDATE:hashchange
RECONCILE_BEGIN:e4
SNAPSHOT:e4
APPLY_ACTIVE:e4
RECONCILE_END:e4
```

Rules:
- test/debug only;
- bounded;
- semantic labels only;
- no native text/IDs.

This makes lifecycle failures much easier to localize.

### Batch A review

Do a quick controller self-review only.

No fresh external reviewer yet unless:
- lifecycle test required more than 2 fix attempts;
- spec-deviation pressure appears.

---

# 9. Batch B — Tasks 3-4

## Task 3 model

Start with **GPT-5.6 Sol Medium**.

Escalate to Astra High if:
- selected standard mapping is ambiguous;
- PowerTeacher DOM evidence conflicts;
- geometry/visibility bug survives two hypotheses.

### Error-detection additions

Create fixtures for:
- extra leading non-standard columns;
- hidden selected cell;
- multiple selected cells;
- detached target;
- zero-size rect;
- stale node from previous grid;
- duplicate protected rect;
- 100 protected rects;
- missing observation node.

For every returned target rect assert:

```text
Number.isFinite(top,left,width,height)
width > 0
height > 0
```

For every native DOM reference assert it never crosses the runtimeTargets -> Step8 UI boundary.

## Task 4 model

**GPT-5.6 Sol Medium**.

Manifest edits are mechanical but potentially high blast radius.

### Error-detection additions

Compare pre/post manifest structurally:

```text
matches: IDENTICAL
permissions: IDENTICAL
host_permissions: IDENTICAL
background: IDENTICAL
version: IDENTICAL
Teacher Support js/css: ONLY approved additions/order
```

Run browser-like script-load harness:
- evaluate scripts in manifest order;
- assert every required global exists before consumer loads;
- bootstrap only once.

### Batch B gate

Run:
- Task 3 suite;
- Task 4 suite;
- Task 2 lifecycle suite;
- syntax checks.

Do not run stress/full regression.

---

# 10. Batch C — Tasks 5-6

## Task 5 model

**GPT-6 Astra High** strongly recommended.

This is the second highest-risk implementation task.

### Mandatory transition tests

For every transition, capture:
- old epoch;
- invalidation;
- new epoch;
- old result arrival;
- whether apply occurred.

Critical sequences:

```text
A eligible -> same-route B
A eligible -> unsupported -> A
rubric -> look-alike
selected -> none
grid1 -> grid2 while route unchanged
target1 measured -> target1 removed -> old result returns
```

Required invariant:

```text
applyEpoch === currentEpoch
```

for every academic/target apply.

### Observer diagnostics

Test-only counters:

```text
observerCreateCount
observerDisconnectCount
observedNodeCount
mutationCallbackCount
```

After rebinding:

```text
active observer count <= approved bound
```

After dispose:

```text
active observer count = 0
```

## Task 6 model

Use **GPT-5.6 Sol Medium** to implement deterministic harnesses.

Use **GPT-6 Astra High** only to investigate a real failing stress case.

### Stress design rules

Every stress family:
- fixed seed;
- deterministic generator;
- compact success summary;
- first-failure minimizer.

Store failure artifact:

```text
stress-family
seed
case-index
minimal-input
expected
actual
head-commit
```

Never dump all 10,000 cases.

### Batch C review — MANDATORY fresh reviewer

Use **GPT-6 Astra High**.

Reviewer gets:
- approved spec;
- implementation plan Task 2-6 interface summary;
- diff from Step 8 baseline to current head;
- evidence ledger;
- stress summaries;
- parked/ruling list.

Reviewer focuses on:
- lifecycle owner;
- epoch semantics;
- observer boundedness;
- target-node leakage;
- native obstruction;
- performance;
- privacy;
- accidental academic/native action.

If Critical/Important:
- persist RED;
- one fix wave;
- scoped re-review.

---

# 11. Batch D — Tasks 7-8

## Task 7 model

Use **GPT-6 Astra High** for final whole-branch review.

Implementation/controller may remain on **GPT-5.6 Sol Medium** for running deterministic gates and preparing evidence.

### Final regression ordering

Run cheap/high-signal gates before expensive gates:

```text
1 syntax
2 static safety/privacy
3 manifest exact delta
4 exact runtime file delta
5 Step 9 focused
6 lifecycle/epoch/matrix
7 stress
8 Step 8 placement 10k
9 frozen Step 5-8 regression
10 package/re-extract replay
```

Why:
- if manifest or static safety already fails, do not waste quota/time on large suites.

### Failure rule

If final regression fails:
- identify which dependency changed since its last green evidence;
- rerun/redebug only affected layer first;
- do not rerun entire final stack after every tiny fix.

### Final reviewer fix wave

At most one bundled final-review fix wave before scoped re-review.

Do not dispatch one fixer per finding.

---

## Task 8 model

Use **GPT-5.6 Sol Medium** for packaging/report orchestration.

Use **GPT-6 Astra High** only if live behavior reveals a non-obvious integration bug.

Live user actions remain manual/authorized.

### Live error capture

For a live failure capture only:

```text
scenario
expected
actual
route family
sanitized semantic state
runtime phase
epoch
target kind
placement status
console error attributable to Step9
```

Never capture student/teacher names, IDs, scores, comments, or tokens.

### Live defect flow

```text
live failure
-> minimal sanitized evidence
-> deterministic reproduction
-> RED
-> root cause
-> minimum fix
-> affected gates
-> repeat exact live scenario
```

If deterministic reproduction cannot be made:
- document why;
- add the narrowest safe diagnostic;
- do not guess.

---

# 12. Model escalation table

| Situation | Model | Reasoning |
| --- | --- | --- |
| Task 1 hash/evidence | GPT-5.6 Sol | Medium |
| Task 2 lifecycle | GPT-6 Astra | High |
| Task 3 normal target mapping | GPT-5.6 Sol | Medium |
| Task 3 ambiguous DOM mapping | GPT-6 Astra | High |
| Task 4 manifest/bootstrap | GPT-5.6 Sol | Medium |
| Task 5 epoch/observer | GPT-6 Astra | High |
| Task 6 harness writing | GPT-5.6 Sol | Medium |
| Stress failure diagnosis | GPT-6 Astra | High |
| Routine packaging | GPT-5.6 Sol or Terra | Medium |
| Batch C architecture review | GPT-6 Astra | High |
| Task 7 final review | GPT-6 Astra | High |
| Small review fix | GPT-5.6 Sol | Medium |
| Repeated unexplained failure | GPT-6 Astra | High |

If Astra is unavailable, use GPT-5.6 Sol High for the Astra rows.

---

# 13. Review protocol optimized for error detection and quota

Do NOT review every trivial commit with a fresh agent.

Fresh reviews at:
1. end of Batch C;
2. Task 7 final whole-branch review.

Immediate extra review only if:
- Critical safety invariant failed;
- frozen file was proposed for modification;
- three-fix breaker fired;
- runtime model needed architecture ruling.

Review package should contain file paths, not pasted histories.

Reviewer returns:

```text
SPEC COMPLIANCE: PASS|FAIL
CODE QUALITY: PASS|FAIL
CRITICAL
IMPORTANT
MINOR
TEST GAPS
ARCHITECTURE DRIFT
```

Only Critical/Important block next gate.

---

# 14. Evidence invalidation rules

A PASS is reusable only if dependencies unchanged.

Examples:

```text
runtimeTargets tests
depend on:
  runtime-targets.js
  adapter contract fixture
  geometry helper

manifest tests
depend on:
  manifest.json
  bootstrap filename/load contract

Step8 placement 10k
depend on:
  interaction-orchestrator.js
  geometry semantic contract

Step7 academic regression
depend on:
  frozen Step7 content/policy files
```

When a file changes:
- mark only dependent gates `stillValid=false`;
- rerun only those.

This prevents wasteful full-suite repetition.

---

# 15. Detection signals that force immediate escalation

Escalate to Astra High when any occurs:

1. same test still fails after two materially different hypotheses;
2. a stale epoch result reaches UI;
3. more than one runtime/root/listener owner appears;
4. native control is obstructed;
5. mutation/invalidation stress shows unbounded reconcile growth;
6. frozen regression unexpectedly fails;
7. manifest adds unexpected permission/match;
8. implementation seems to require frozen Step 5-8 file modification;
9. test passes but live PowerTeacher contradicts expected semantics;
10. Codex cannot state the root cause in one precise sentence.

---

# 16. Things Codex must NEVER do to “fix” a failing test

Never:
- weaken assertion;
- raise stress threshold;
- reduce stress count;
- remove failing fixture;
- skip test;
- mark flaky without proof;
- add arbitrary delay;
- add polling;
- catch and ignore exception;
- hide duplicate root;
- suppress console error;
- broaden selector;
- default to ME/any grade;
- click native UI automatically;
- refactor frozen code without RED + approval.

---

# 17. Compaction-safe recovery

Before every compaction write:

```text
PLAN
BATCH
TASK
TASK_BASE
HEAD
FILES_CHANGED
LAST_GREEN
CURRENT_RED
ROOT_CAUSE_STATUS
FIX_ATTEMPTS
STEP8_SHA
EVIDENCE_LEDGER
OPEN_FINDINGS
RULINGS
NEXT_COMMAND
```

After compaction:
1. read only recovery checkpoint;
2. verify HEAD;
3. inspect ledger;
4. resume next command;
5. do not redispatch completed tasks;
6. do not rerun still-valid gates.

---

# 18. Final acceptance before live test

Do not start live validation unless:

```text
Step9 focused = PASS
500 lifecycle = PASS
10000 invalidations = PASS
1000 epoch transitions = PASS
target disappearance = PASS
route/class/grid matrix = PASS
Step8 placement 10000 / unsafe 0
frozen regression = PASS
syntax = PASS
static safety/privacy = PASS
manifest exact delta = PASS
runtime exact delta = PASS
Batch C review = no open Critical/Important
Task7 final review = no open Critical/Important
```

Then status may be:

`STEP 9 ENGINEERING COMPLETE - AWAITING AUTHORIZED LIVE VALIDATION`

---

# 19. Final acceptance after live test

Only after live smoke meets every required zero/one invariant:

`STEP 9 LIVE RUNTIME INTEGRATION PASS - READY FOR CONVERGENCE REVIEW`

Never claim:
`PRODUCTION READY`

---

# 20. Recommended controller prompt

Use this as the top-level Codex execution instruction:

> Execute the approved Step 9 spec and implementation plan using the Step 9 Codex Execution + Error-Detection Playbook. Preserve the frozen Step 8 artifact as the input authority. Use TDD and the task-local error-detection gates. Default to GPT-5.6 Sol Medium; use GPT-6 Astra High only for Tasks 2 and 5, stress/lifecycle debugging, Batch C architecture review, and Task 7 whole-branch review. Maintain the evidence ledger and compaction checkpoint. Do not redo completed work after compaction. Do not fix any failure until you classify it and establish root-cause evidence. Never weaken a gate to obtain green. Run focused tests first, broad regression only at batch/final gates. Stop only for the plan's hard-stop conditions. A complete final handoff is mandatory.
