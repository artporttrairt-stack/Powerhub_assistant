# Generic Teacher Support Engine + Isolated MS1 Lab — Handoff

Date: 2026-10-05  
Repository: `artporttrairt-stack/Powerhub_assistant`  
Working branch: `agent/ms1-generic-engine-lab-20261005`

## Status

**STATIC / DETERMINISTIC: PASS**  
**AUTHORIZED LIVE POWERSCHOOL SMOKE: PENDING**  
**PRODUCTION INTEGRATION / MERGE / STORE PUBLISH: NOT AUTHORIZED**

The Generic Teacher Support Engine, CAM Primary MS1 pack, generic guidance UI, single runtime lifecycle, deterministic isolated Lab builder, and verification gates are implemented on the isolated working branch.

The current environment does not have an authenticated `vas.powerschool.com` browser profile. Therefore the required authorized live smoke was not executed and must not be represented as PASS.

## Source of Truth

- Protected production base: `bcd9cb7996247c1f32706c9b41449ac947e7bb15`
- Canonical Generic Engine spec:
  - `docs/superpowers/specs/2026-10-05-teacher-support-generic-engine-isolated-lab-design.md`
  - approved spec commit: `f760f0d0ee14d54c9ece5ac4e26fd08737a79b9b`
- Inherited MS1 Final Spec:
  - `docs/superpowers/specs/2026-10-04-ms1-isolated-lab-design.md`
  - approved commit: `a56ceafa3d022042c87b178243f51e058efcc8a0`
- Canonical grouped implementation plan:
  - `docs/superpowers/plans/2026-10-05-teacher-support-generic-engine-isolated-lab.md`
  - plan commit: `fa6f8c05fc4b8fccd2e1dd41313b0050a2ee0a6d`
- Verified implementation/build source commit:
  - `80c889cafb3217dfb5b024e3097aef77f3fdea5a`

The verified build source commit is intentionally the implementation checkpoint used to produce the deterministic Lab artifact. Later handoff-only cleanup commits do not redefine that verified artifact.

## Architecture Delivered

Canonical new source is confined to:

`extension/modules/teacher-support/**`

Delivered boundaries:

- generic workflow registry;
- generic support state resolver;
- generic controller;
- read-only PowerTeacher semantic UI contract/adapter;
- CAM Primary MS1 workflow/content pack;
- generic entry button / assistant panel / contextual Score Inspector;
- one Teacher Support runtime lifecycle owner;
- deterministic isolated Lab builder and verifier.

The Lab does **not** import or execute the protected Phase 0 Teacher Support registry/lifecycle under `extension/src/**`.

Phase 0 remains frozen/protected for the Lab phase. Future production integration must converge to one registry + one lifecycle rather than running both implementations long-term.

## Academic / Safety Gates Delivered

The implementation preserves the approved fail-closed rules, including:

- workflow availability and contextual academic eligibility are separate gates;
- generic `MS1` text/filter value alone is never academic eligibility;
- contextual eligibility requires verified PowerTeacher + verified Standards + current official rubric strand + selected native cell mapped by relative standard-column position + exact `EE / AE / ME / BE / WB` scale + fresh context;
- current-strand logic is pagination-aware and does not require 8/8 categories simultaneously in the DOM;
- only the approved live aliases are accepted;
- TA Grade / TA Score / VN Ranking / Unit / LSPC and ambiguous MS1 columns fail closed;
- same-path route/class invalidation clears stale contextual state even if `MS1` filter text persists;
- no fixed absolute cell index identifies the strand;
- Hub reference controls never write or recommend a final PowerSchool level;
- English is default; VI is explicit MS1-only assistance;
- unknown subjects receive no borrowed subject example.

## Runtime / Performance Boundary

The canonical runtime owns the PowerTeacher lifecycle boundary.

Verified constraints:

- one extension-owned Teacher Support root;
- one `hashchange` listener;
- one `popstate` listener;
- at most one delegated click boundary on the currently verified Standards grid;
- old grid boundary detaches before a new one can attach;
- no document-wide native click listener;
- no `MutationObserver`;
- no polling / `setInterval`;
- no recurring `requestAnimationFrame`;
- no persistent storage activity;
- no network / analytics activity;
- no native `.click()`, `dispatchEvent()`, synthetic typing, grade write, Fill, Save, Publish, Send, comment/flag mutation, Undo or Recalculate;
- extension-owned target hint only;
- finite CSS-only motion with reduced-motion handling.

## Deterministic Verification Evidence

GitHub Actions run:

- run ID: `37243656041`
- branch: `agent/ms1-generic-engine-lab-20261005`
- source commit: `80c889cafb3217dfb5b024e3097aef77f3fdea5a`
- conclusion: **SUCCESS**

Command:

`npm run verify:teacher-support`

Results:

- Phase 0 tests: **38 / 38 PASS**
- Teacher Support tests: **83 / 83 PASS**
- new-source/test/tool syntax checks: **33 files PASS**
- Lab build #1: **PASS**
- Lab checksum validation #1: **21 files PASS**
- Lab build #2: **PASS**
- Lab checksum validation #2: **21 files PASS**
- deterministic checksum comparison: **PASS**
- protected production diff: **PASS**
- full verifier: **PASS**

## Lab Artifact Identity

Lab version: `0.1.0`

Generated directory:

`dist/ms1-lab/`

Generated checksum file:

`dist/ms1-lab/SHA256SUMS.txt`

SHA-256 of `SHA256SUMS.txt` at verified source commit `80c889c...`:

`5ebb342f65653e6edf64d7389dc0c8d956a278df579871f8e9449255761989b3`

Selected artifact hashes:

- `manifest.json`: `3b78b40e48e4b7ee9132a33ab71440c4a032845f3e81049c5f16ed4043598fcc`
- `lab-bootstrap.js`: `e04d74f3bbabc84a1cb175520f1d2a75797edbf08f38789191f0ffe1084bcbee`
- `modules/teacher-support/runtime/support-runtime.js`: `40d18a5404c1c94904d6bcef5f7ebf93fa48d6118fa08a5a2d10e4aa732ade94`
- `modules/teacher-support/packs/cam-primary/ms1/content/official.js`: `e18aa4e1313be256dbfe60b685c43bea3e1e2c7e1c9d97f14a45bfea3f5c9509`
- `assets/robot-assistant.png`: `f56b1f8baf7674b6ddffd39fd62febe1cf6a76be3ac42a06f8eb4da711c6a96d`

`BUILD_INFO.json` records:

- protected base: `bcd9cb7996247c1f32706c9b41449ac947e7bb15`
- source spec: canonical 2026-10-05 Generic Engine spec;
- source plan: canonical 2026-10-05 grouped plan;
- source commit: `80c889cafb3217dfb5b024e3097aef77f3fdea5a`;
- Lab version: `0.1.0`.

## Protected Production State

Verification confirms no change to:

- `extension/manifest.json`
- pre-existing `extension/src/**`
- pre-existing `extension/assets/**`

No production runtime integration has been performed.

No Store ZIP has been created or published.

No merge to `main` is authorized by this handoff.

## Live Smoke — Pending Gate

The required live smoke must be run only in an authorized PowerTeacher test account/profile with the unpacked `dist/ms1-lab` build from the verified implementation checkpoint.

Required sequence:

1. exact `https://vas.powerschool.com/teachers/*` host only;
2. one floating Teacher Support entry and no native layout obstruction;
3. finite spring and reduced-motion behavior;
4. finite Error Bot bounce and usable image-failure fallback;
5. Guide me: Grading -> Standards;
6. hidden-filter and already-visible-filter branches;
7. teacher manually types `MS1`;
8. generic/persisted `MS1` filter alone does not activate contextual academic guidance;
9. TA Grade / TA Score / VN Ranking / Unit / LSPC never activate contextual academic guidance;
10. pagination: one verified current rubric strand may activate without 8/8 categories being present;
11. teacher manually opens a rubric cell; Score Inspector follows the correct current strand by relative standard-column mapping;
12. Hub `EE / AE / ME / BE / WB` controls affect Hub explanation only and never PowerSchool;
13. VI appears only after explicit teacher action;
14. unknown subject gets no borrowed example;
15. class switch while inspector is open invalidates stale guidance even on the same normalized `/classes/final_grades` route with persisted filter;
16. collapse/wake/re-entry/route cycles create no duplicate root/listeners;
17. no attributable console error or obvious idle CPU spike.

Until this live sequence passes, production integration readiness remains **blocked**.

## Known Limitations

- Live PowerTeacher smoke is pending because the current automation browser profile has no recorded authenticated PowerSchool session.
- This branch validates the isolated Lab only; it does not migrate the protected Phase 0 production entrypoints.
- The Lab uses explicit trusted pack selection and is not a production auto-activation mechanism.
- No production version bump, Store packaging, merge, or rollout is included.

## Rollback

The isolated Lab has no production dependency.

To roll back a live Lab test:

1. disable/remove the unpacked `dist/ms1-lab` extension from the test browser;
2. refresh PowerTeacher;
3. leave the production Hub Assistant extension unchanged.

Git rollback is branch-local: abandon/delete the isolated working branch. Protected `main @ bcd9cb...` remains unchanged.

## Next Authorized Decision

After the authorized live smoke passes, perform a separate review before any production integration.

That future decision must explicitly address Phase 0 convergence so production ends with **one canonical Teacher Support registry + one lifecycle**, not two parallel engines.

This handoff does not authorize merge, production integration, Store publication, or rollout.
