# Stage 2A MS1 Live Validation — 2026-10-04

## Status

**PENDING LIVE POWERSCHOOL SMOKE**

Deterministic verification is green on the feature branch before live smoke:

- Branch: `feature/stage2a-g0-ui-contract`
- Phase 0 tests: 38 / 38 pass
- Stage 2 tests: 89 / 89 pass
- Stage 2 syntax: 45 files pass
- No native grade / Fill / Save / Publish / Send / comment / flag / Undo automation
- No broad MutationObserver
- No polling
- MS1 rubric gate requires the complete eight-strand context; generic MS1 text, TA Grade, Ranking, or a partial strand set is insufficient

## Live smoke purpose

This is the only remaining acceptance gate for Stage 2A. Do not merge to `main` and do not build a Store ZIP until this smoke passes.

Use an authorized Primary PowerTeacher account only.

## Load the branch

Use the current `feature/stage2a-g0-ui-contract` branch and load the repository's `extension/` directory as an unpacked extension.

Do not substitute an older release ZIP for this smoke.

## Smoke A — Entry and navigation

1. Open a normal PowerTeacher page under `https://vas.powerschool.com/teachers/*`.
2. Confirm one Hub Teacher Support root appears only once.
3. Confirm the robot and separate compact bubble bars do not break the native page layout.
4. Choose **Choose a reporting task**.
5. Choose **MS1 Report**.
6. From a non-Grading page, confirm Hub highlights/instructs **Grading** only; Hub must not click it.
7. Manually open **Grading**.
8. Press **Continue from where I am**.
9. Confirm Hub highlights/instructs **Standards** only.
10. Manually open **Standards**.
11. Press **Continue from where I am**.

Expected:
- no duplicate Hub UI;
- no synthetic native click;
- already-completed navigation steps are skipped on each re-read.

## Smoke B — Filter resume

1. With Standards active and filter hidden, press **Continue from where I am**.
2. Confirm Hub points to the Standards gear / Special Functions.
3. Manually open it.
4. If the verified dynamic toggle shows **Show Filter**, open it manually.
5. Press **Continue from where I am**.
6. Confirm Hub points to the Standards filter input.
7. Manually type `MS1`.
8. Press **Continue from where I am**.

Expected:
- if the filter is already visible, Hub skips the gear step;
- if `MS1` is already the current query, Hub skips the query step;
- Hub never clicks Gear, Show Filter, Apply, Clear, or the input.

## Smoke C — Exact MS1 safety gate

After filtering `MS1`, verify Hub opens the MS1 area picker only when the complete eight-strand context is visible.

The canonical semantic groups are:

- `MS1-Academic`
- `MS1-Attitude`
- `MS1-Behaviour`
- `MS1-Classwork`
- `MS1-Communication`
- `MS1-Collaboratively`
- `MS1-Creativity`
- `MS1-Equipment`

Official display-name aliases are accepted, including `MS1 - Academic Achievement`.

Expected:
- all eight groups present -> area picker opens;
- TA Grade only -> no rubric;
- Ranking only -> no rubric;
- partial strand set -> no rubric;
- generic visible `MS1` text alone -> no rubric.

## Smoke D — Guidance content

1. Confirm all eight areas are available:
   - Academic Achievement
   - Attitude Towards Learning
   - Behaviour & Personal Development
   - Completion of Classwork/Homework
   - Communication Skills
   - Working Collaboratively
   - Creativity & Critical Thinking
   - Equipment & Resources
2. Open at least one area.
3. Confirm all five levels are available: `EE / AE / ME / BE / WB`.
4. Open one level.

Expected guidance layers:
- **OFFICIAL CRITERION**
- plain-language explanation
- classroom evidence where source-backed
- observation questions/checklist
- English / Maths / Science example only when the current course label supports that overlay
- adjacent-level comparison where available
- explicit teacher-final-decision message

Do not expect Hub to recommend or enter a grade.

## Smoke E — Teacher control

For one test student/context, confirm Hub does **not**:

- enter a score or grade;
- click Fill;
- click Save;
- click Publish;
- send anything;
- write comments;
- toggle flags;
- Undo/revert;
- dispatch synthetic native actions.

The teacher remains responsible for native PowerSchool entry and save.

## Smoke F — Collapse / wake / route switch

1. Collapse Hub with **I know already**.
2. Wake Hub.
3. Confirm there is still one Hub root and no duplicate listeners/UI.
4. Change class/route.
5. Confirm old area/level guidance disappears immediately.
6. Confirm Hub shows a checking/continue state instead of carrying stale rubric guidance forward.
7. After PowerTeacher finishes loading, press **Continue from where I am**.
8. Confirm Hub resolves the new page/class state from the DOM.

Expected:
- no stale task guidance across route/class changes;
- no obvious CPU spike;
- no new console error.

## Smoke G — Existing product regression

Confirm the existing PowerHub product still loads and its normal core smoke remains PASS.

## PASS record

When every item above passes, update this file to:

`STATUS: PASS`

and record:

- tested branch HEAD SHA;
- browser + version;
- date/time;
- tested PowerTeacher route family;
- duplicate UI: none;
- console errors: none attributable to Teacher Support;
- native automation: none;
- PowerHub regression smoke: PASS.

## Failure rule

Any live failure means:

**STOP -> reproduce -> add deterministic regression test -> minimal fix -> re-run affected suite -> re-run full Stage 2 verification -> repeat only the failed live-smoke slice.**

Do not work around a failure by weakening the eight-strand gate or adding polling / a broad MutationObserver.
