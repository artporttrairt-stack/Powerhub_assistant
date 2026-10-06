# STEP 9 — CODEX LOW-QUOTA START HERE

## Mission

Execute **Step 9 only**: live Teacher Support runtime integration on PowerTeacher.

Do not redesign Step 8. Do not add guides. Do not change MS1 academic policy. Do not merge/publish/version-bump.

## Authority

Use this precedence:

1. `docs/superpowers/specs/2026-10-06-step-09-live-runtime-integration-design.md`
2. `docs/superpowers/plans/2026-10-06-step-09-live-runtime-integration.md`
3. `docs/superpowers/plans/2026-10-06-step-09-codex-execution-error-detection-playbook.md`
4. exact final Step 8 runtime + handoff + hash inventory
5. current task RED/GREEN evidence

This file is a navigation aid only and cannot weaken the spec or plan.

## First action

Before writing runtime code:

- locate final Step 8 runtime;
- read final Step 8 SHA inventory;
- recompute SHA-256;
- require exact match;
- create/update `verification/step09/evidence-ledger.json`.

If Step 8 hash cannot be verified: STOP.

## Normal runtime delta

Only:

```text
CREATE extension/modules/teacher-support/platform/powerteacher/runtime-targets.js
CREATE extension/modules/teacher-support/runtime/support-runtime.js
CREATE extension/modules/teacher-support/bootstrap/powerteacher.js
MODIFY extension/manifest.json
```

All other Step 5-8 runtime files remain frozen unless a persisted RED interface defect is explicitly reviewed.

## Execution batches

```text
A = Tasks 1-2  authority + sole lifecycle
B = Tasks 3-4  targets/geometry + bootstrap/manifest
C = Tasks 5-6  epoch/invalidation + stress/safety
D = Tasks 7-8  full regression + live validation + package/handoff
```

Stay sequential on shared runtime files.

## Low-quota rule

Priority:

```text
correctness
> safety
> evidence
> recoverability/handoff
> quota efficiency
```

Save tokens by removing repeated work, never by removing required gates.

Use:

```text
focused test
-> affected suite
-> batch gate
-> final regression
-> package replay
-> live smoke
```

Do not rerun all regression/stress after every small edit.

Do not reread unchanged specs, old chats, superseded Step 8 drafts, or unrelated project history.

## Stress targets

Final engineering evidence must include:

```text
500 lifecycle cycles
10,000 invalidation signals
1,000 context transitions
target-disappearance stress
route/class/grid pairwise matrix
Step 8 placement: 10,000 cases / 0 unsafe
```

Stress success output is summary only. On failure, emit the first reproducible failing seed/case, not all cases.

## Absolute safety rules

Never:

- click/type/grade/Fill/Save/Publish/Send for the teacher;
- infer EE/AE/ME/BE/WB;
- trust route or persisted `MS1` filter alone for academic eligibility;
- keep stale academic state across class/context epoch;
- guess a native selector/target;
- overlap protected native controls;
- use `MutationObserver(document.body)`;
- poll, `setInterval`, recurring RAF, or continuous scans;
- add network/analytics/new Teacher Support storage;
- create a second Teacher Support root/lifecycle owner.

If no safe placement:

```text
move -> compact -> collapse -> suspend
```

## Compact task record

After each task record only:

```text
TASK
COMMIT
FILES
TEST
RESULT
NEW RISK
EVIDENCE INVALIDATED
NEXT
```

No full handoff between normal tasks.

## Compaction checkpoint

Before compaction preserve:

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

Resume from that checkpoint. Do not restart discovery.

## Review budget

Quota-first execution:

- one execution context for Tasks 1-6;
- fresh architecture/safety review after Batch C;
- strongest fresh whole-Step-9 review in Task 7;
- additional fresh agent only on Critical/ambiguous failure.

Recommended model routing:

- default implementation: **GPT-5.6 Sol / Medium**;
- Task 2 lifecycle: **GPT-6 Astra / High**;
- Task 5 epoch/observer: **GPT-6 Astra / High**;
- real stress/lifecycle bug diagnosis: **GPT-6 Astra / High**;
- Batch C architecture/safety review: **GPT-6 Astra / High**;
- Task 7 whole-Step-9 review: **GPT-6 Astra / High**;
- routine packaging/evidence: **GPT-5.6 Sol / Medium** (Terra may be used for purely mechanical bookkeeping if available).

If Astra is unavailable, use **GPT-5.6 Sol / High** for those Astra slots.

Do not use highest reasoning by default.

## Stop conditions

Stop only for:

1. unverifiable Step 8 baseline;
2. destructive/security-sensitive/external side effect requiring approval;
3. frozen-interface defect requiring spec deviation;
4. live validation failure requiring a RED fix loop;
5. architecture ambiguity where every path would be a guess.

Difficulty alone is not a stop condition.

## Completion

Engineering only:

`STEP 9 ENGINEERING COMPLETE - AWAITING AUTHORIZED LIVE VALIDATION`

After authorized live PASS:

`STEP 9 LIVE RUNTIME INTEGRATION PASS - READY FOR CONVERGENCE REVIEW`

Never claim `PRODUCTION READY`.

Final handoff is mandatory.
