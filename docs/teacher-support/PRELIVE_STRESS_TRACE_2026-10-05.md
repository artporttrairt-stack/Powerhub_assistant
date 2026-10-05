# MS1 Lab — Pre-Live Stress Test & Traceability Audit

Date: 2026-10-05  
Repository: `artporttrairt-stack/Powerhub_assistant`  
Branch: `agent/ms1-generic-engine-lab-20261005`

## Verdict

**DETERMINISTIC PRE-LIVE STRESS: PASS**  
**TRACEABILITY AUDIT: PASS**  
**AUTHORIZED LIVE POWERSCHOOL SMOKE: STILL REQUIRED**  
**PRODUCTION INTEGRATION / MERGE / STORE PUBLISH: NOT AUTHORIZED**

No production module fix was required by this stress pass.

Canonical implementation remains:

`02427d5763dd73889b6430af30aff0f71af08a9a`

Pre-live stress harness/artifact source:

`809eec0b836a6e790ef9fe46ac0740c9637acb28`

A git comparison from the canonical implementation checkpoint to the stress head contains no changes under `extension/modules/teacher-support/**`. The stress stage adds only tests/temporary CI/documentation. Therefore the stress pass validates the same canonical runtime/module bytes already approved at the implementation checkpoint.

## Fresh CI Evidence

GitHub Actions:

- run: `37245489576`
- source commit: `809eec0b836a6e790ef9fe46ac0740c9637acb28`
- conclusion: **SUCCESS**

Fresh full verifier:

- Phase 0: **38 / 38 PASS**
- Teacher Support: **95 / 95 PASS**
- failures: **0**
- deterministic Lab build: **PASS**
- protected production diff: **PASS**
- full `verify:teacher-support`: **PASS**

Ten additional clean-process soak runs were executed after the full verifier:

- soak runs: **10 / 10 PASS**
- each soak: **95 / 95 PASS**
- total additional soak executions: **950 Teacher Support tests**
- full verifier + soak total: **1,045 Teacher Support test executions**

No flaky failure was observed.

## Deterministic Stress Cases

The canonical stress suite is:

`tests/teacher-support/stress/prelive-stress.test.js`

Per suite execution it verifies:

1. **100 full runtime lifecycle cycles**
   - repeated `start()`
   - idempotent duplicate `start()`
   - explicit reconcile
   - open / close
   - destroy
   - expected outcome: one owned root while active, one route-listener pair, one grid listener, zero residue after destroy.

2. **250 verified-grid replacements**
   - old delegated listener must detach on every replacement;
   - current verified grid must own exactly one delegated click listener;
   - route listeners and owned root must not duplicate.

3. **5,000 irrelevant native-grid clicks**
   - must trigger **zero semantic DOM rereads**;
   - must queue **zero microtasks**.

4. **1,000 paired `hashchange` + `popstate` bursts**
   - must coalesce to one invalidation per microtask boundary;
   - must not reread PowerTeacher while context is invalidated;
   - old grid listener must detach.

5. **Queued cell reconcile vs destroy race**
   - queued work from an old cell must be cancelled after destroy;
   - no stale semantic read may occur after teardown.

6. **Queued old-grid reconcile vs route invalidation race**
   - invalidation must win;
   - context remains stale until an explicit fresh semantic read.

7. **Queued old-grid reconcile vs grid replacement race**
   - stale old-grid work must not run after the verified grid changes.

8. **500 normalized MS1 look-alike variants**
   - TA Grade / TA Score / VN Ranking / Unit / LSPC families remain fail-closed;
   - none becomes a rubric strand through casing/whitespace/suffix variation.

9. **500 incompatible scale variants**
   - none becomes academically eligible;
   - only exact ordered `EE / AE / ME / BE / WB` is compatible.

10. **Approved-alias near-match checks**
    - approved live alias remains eligible when all other gates pass;
    - prefixed/suffixed/ambiguous near matches fail closed.

11. **1,000 real owned-DOM rerenders**
    - uses the real entry button, assistant panel, Score Inspector and target hint, not UI spies;
    - exactly one node per owned component;
    - exactly one target hint;
    - teardown returns owned root children to zero.

Because the suite is also included in each of the ten soak processes, aggregate stress exposure in the final run includes at least:

- **1,100** full runtime lifecycle cycles;
- **2,750** verified-grid replacements;
- **55,000** irrelevant grid clicks;
- **22,000** route invalidation events;
- **5,500** normalized look-alike cases;
- **5,500** incompatible scale cases;
- **11,000** real owned-DOM rerender cycles.

These are deterministic operation-count tests, not wall-clock browser performance benchmarks.

## Traceability Chain

### Authority -> plan -> implementation -> verification

1. Protected production base  
   `bcd9cb7996247c1f32706c9b41449ac947e7bb15`

2. Inherited approved MS1 Final Spec  
   `docs/superpowers/specs/2026-10-04-ms1-isolated-lab-design.md`  
   commit `a56ceafa3d022042c87b178243f51e058efcc8a0`

3. Approved Generic Engine architecture spec  
   `docs/superpowers/specs/2026-10-05-teacher-support-generic-engine-isolated-lab-design.md`  
   commit `f760f0d0ee14d54c9ece5ac4e26fd08737a79b9b`

4. Canonical grouped implementation plan  
   `docs/superpowers/plans/2026-10-05-teacher-support-generic-engine-isolated-lab.md`  
   commit `fa6f8c05fc4b8fccd2e1dd41313b0050a2ee0a6d`

5. Canonical implementation checkpoint  
   `02427d5763dd73889b6430af30aff0f71af08a9a`

6. Pre-live stress suite  
   initial stress commit `2ac55a04fb6f5dff562013d161fbe424ba5c6ce4`  
   real owned-DOM stress commit `809eec0b836a6e790ef9fe46ac0740c9637acb28`

7. Final pre-live stress CI  
   run `37245489576` -> **PASS**

8. Recommended pre-live artifact  
   artifact name `ms1-lab-prelive-stress`  
   artifact ID `11318509392`  
   uploaded archive digest `sha256:20b23bafd4117e8b68d63b65e7215a4bcc8233ff568c4342d0306339e6b237f9`  
   internal `SHA256SUMS.txt` digest `fe5ec5b0cb812f9f0a3d4929df16644e206f1ee8c8f1b4d19b32ee7abcd56cac`

### Requirement trace matrix

| Requirement / risk | Canonical owner | Primary deterministic evidence | Stress evidence |
| --- | --- | --- | --- |
| one runtime owner / no duplicate root | `runtime/support-runtime.js` | `runtime/support-runtime.test.js` | 100 lifecycle cycles + 1,000 real UI rerenders |
| one route listener pair | runtime | runtime tests + static safety | 1,000 paired route bursts |
| at most one verified-grid delegated listener | runtime + adapter | runtime tests | 250 grid replacements |
| irrelevant native clicks do no semantic work | runtime | delegated-boundary tests | 5,000 irrelevant clicks |
| stale queued work cannot revive old context | runtime | same-path invalidation tests | destroy / route / replacement race tests |
| relative cell-to-strand mapping | `platform/powerteacher/ui-adapter.js` | `platform/ui-adapter.test.js` | protected by grid/race stress |
| only verified keypad score semantics | UI contract + adapter | G0 selector regression tests | full verifier + soak |
| exact academic gate | `packs/cam-primary/ms1/applicability.js` | pack-contract tests | 500 look-alikes + 500 bad scales |
| 8x5 official wording/provenance | `content/official.js` | `official-content.test.js` | full verifier + soak |
| interpretive guidance provenance | `content/guidance.js` / examples / locale | `guidance-content.test.js` | full verifier + soak |
| teacher remains final decision maker | pack locale/content + inspector | guidance/inspector tests | full verifier + soak |
| no native consequential action | generic runtime/module boundary | static safety tests | full verifier + soak |
| no polling / observer / storage / network | generic runtime/module boundary | static safety tests | full verifier + soak |
| protected production unchanged | protected-boundary test + verifier | binary git diff | final stress verifier PASS |
| deterministic isolated artifact | `tools/build-ms1-lab.mjs` | build tests + verifier double-build | final stress artifact identity |

## Runtime Event Trace

### Entry click

`?`
-> entry semantic intent `open`
-> runtime `handleIntent('open')`
-> `renderIntro()`
-> controller reference options
-> pack-owned intro metadata
-> extension-owned panel

No native click is synthesized and no academic eligibility is inferred from the entry click.

### Guide / resume

teacher semantic intent
-> runtime `reconcile()`
-> one adapter semantic read
-> generic controller
-> selected MS1 pack policy
-> safe guidance state or contextual eligibility result
-> owned panel / inspector update

### Native Standards cell

one delegated click on verified grid
-> adapter classifies interaction
-> bounded microtask
-> runtime verifies the same grid is still current
-> fresh semantic read
-> relative standard-position mapping
-> pack academic gate
-> contextual Score Inspector only if all gates pass

### Route / class invalidation

`hashchange` or `popstate`
-> runtime invalidation
-> `contextFresh = false`
-> context epoch increment
-> old grid listener detached
-> selected level/area/current strand cleared
-> hint/inspector cleared
-> **no fresh academic read automatically**

Academic guidance can return only after a later explicit fresh semantic read.

### Destroy

destroy
-> grid listener detached
-> route listeners detached
-> owned UI destroyed
-> root removed
-> `started = false`

Any already queued old-grid microtask checks the current lifecycle/grid and exits without rereading stale UI.

## Academic Provenance Trace

Canonical source IDs:

- official: `cam-primary-ms1-official`
- interpretive: `cam-primary-ms1-interpretive`

Official content verification proves:

- exactly **8 categories x 5 levels = 40 cells**;
- each cell carries `cam-primary-ms1-official`;
- exact approved wording is pinned in tests;
- no threshold/formula/recommendation fields are present.

Interpretive guidance verification proves:

- every official cell has source-backed guidance;
- interpretive items carry `cam-primary-ms1-interpretive`;
- VI is explicit MS1-only assist with EN fallback;
- unsupported VI is not synthesized;
- subject examples are limited to English / Maths / Science;
- unknown subject returns no borrowed example;
- recommendation/cut-off language is prohibited.

## Protected Production Trace

Final stress verification still reports **PASS protected production diff** against:

`main @ bcd9cb7996247c1f32706c9b41449ac947e7bb15`

No stress-stage change touches canonical production runtime paths:

- `extension/manifest.json`
- existing `extension/src/**`
- existing `extension/assets/**`

No merge, production integration, version bump, Store ZIP or publication is authorized.

## What Deterministic Stress Cannot Prove

The following remain **live-only** and must not be marked PASS from CI:

1. current authorized PowerTeacher DOM actually matches the G0 contract in the target account/session;
2. visual placement does not obscure native controls at real viewport sizes/zoom;
3. CSS spring/bounce feels appropriate in a real browser and honors real OS reduced-motion;
4. the Error Bot asset loads correctly through the unpacked extension URL;
5. PowerTeacher's actual asynchronous DOM timing after class/page transitions behaves within the verified event model;
6. native keypad `#keypad-score` and dynamic score buttons are still present as G0 verified;
7. no attributable console errors occur in the real page;
8. real idle CPU/memory remains acceptable over a live session.

These are the reasons the authorized live smoke remains a hard gate.

## Live Entry Criteria

Use the stress-verified artifact, not an older ad-hoc build:

- artifact: `ms1-lab-prelive-stress`
- artifact ID: `11318509392`
- source commit: `809eec0b836a6e790ef9fe46ac0740c9637acb28`
- archive digest: `sha256:20b23bafd4117e8b68d63b65e7215a4bcc8233ff568c4342d0306339e6b237f9`
- internal checksum-list digest: `fe5ec5b0cb812f9f0a3d4929df16644e206f1ee8c8f1b4d19b32ee7abcd56cac`

The canonical Teacher Support module bytes in this artifact are unchanged from implementation checkpoint `02427d5...`; the newer source commit adds stress/test/CI evidence and updates `BUILD_INFO.json`.

## Pre-Live Decision

There is no deterministic blocker remaining from this stress/trace pass.

This is **not** a live PASS.

Next permitted gate:

**authorized unpacked-extension PowerTeacher smoke using the stress-verified artifact.**


## Independent Rerun #2

A second independent pre-live rerun was executed after the first stress/trace pass, without changing canonical Teacher Support module bytes.

GitHub Actions:

- run: `37246481661`
- rerun workflow source commit: `16131545bcc29e7d934dee0a4d84f6bef1eba7c5`
- conclusion: **SUCCESS**
- Phase 0: **38 / 38 PASS**
- Teacher Support full verifier: **95 / 95 PASS**
- ten additional clean-process soak runs: **10 / 10 PASS**
- each soak: **95 / 95 PASS**
- deterministic Lab build: **PASS**
- protected production diff: **PASS**

Rerun artifact:

- name: `ms1-lab-prelive-rerun`
- artifact ID: `11319581028`
- archive digest: `sha256:5063b8cb17c08c6731b52973cd5d1e11138a83c675f7be5e38db34277dfd912c`
- internal `SHA256SUMS.txt` digest: `5ced1acecb8962906b20815029fc93d274a2d306406644a244c3078b9b7579bd`

Trace verification against canonical implementation `02427d5763dd73889b6430af30aff0f71af08a9a`:

- `extension/modules/teacher-support/**`: **zero diff**
- `extension/manifest.json`: **zero diff**
- pre-existing `extension/src/**`: **zero diff**
- pre-existing `extension/assets/**`: **zero diff**

The rerun checksum differs from the first stress artifact because `BUILD_INFO.sourceCommit` records the rerun workflow commit. It does not indicate a canonical runtime/module change.

The temporary rerun workflow was deleted immediately after evidence collection.

**Result: the second independent rerun reproduced the first pre-live stress result with zero canonical module drift and zero deterministic blocker.**
