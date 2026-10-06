# Hub Assistant Step 9 — Live Runtime Integration Design

**Date:** 2026-10-06  
**Status:** FINAL SPEC FOR USER REVIEW — design approved in chat; implementation is not authorized until this written spec is explicitly approved  
**Repository:** artporttrairt-stack/Powerhub_assistant  
**Documentation branch:** feature/ms1-isolated-lab  
**Upstream engineering checkpoint:** Step 8 final runtime and handoff, status STEP 8 ENGINEERING COMPLETE - READY FOR STEP 9 INTEGRATION  
**Next gate:** explicit user approval of this written specification, then Superpowers writing-plans

---

## 1. Purpose

Step 9 integrates the already-built Teacher Support semantic engine, source-backed MS1 content, and frozen Step 8 generic guidance UI into the real PowerTeacher page through one narrow runtime/lifecycle layer.

Step 9 is an integration and validation step, not a feature-development step.

The product goal is:

PowerTeacher remains the source of truth and the only work surface that performs SIS actions. Hub Assistant reads a bounded, sanitized semantic view of the page, decides whether help is safe and relevant through the existing resolver/controller, presents Step 8 guidance, highlights only verified native targets, and disappears or fails closed whenever confidence is insufficient.

Step 9 must prove that this can run on the live PowerTeacher lifecycle without:

- changing academic policy;
- recommending grades;
- clicking or typing for the teacher;
- blocking native controls;
- duplicating roots/listeners;
- leaking stale class/student/strand context;
- introducing polling or DOM-mutation churn;
- broadening host permissions;
- creating new persistence;
- regressing the frozen Step 7/8 behavior.

---

## 2. Source authority and execution inputs

### 2.1 Authority order

Use the following authority order during Step 9:

1. the exact final Step 8 runtime artifact and its final handoff/verification evidence;
2. this approved Step 9 design specification;
3. the approved Step 9 implementation plan created after this spec is approved;
4. frozen Step 5-8 verification artifacts and source-fidelity evidence;
5. current task-local RED/GREEN evidence;
6. earlier isolated-lab documents only as historical evidence, never as authority over newer frozen artifacts.

Historical drafts, unreconciled plans, chat summaries, and donor branches must not override the current frozen artifact or this approved specification.

### 2.2 Step 8 hash binding

This specification deliberately does not invent a Step 8 SHA-256 value that is not present in the reviewed evidence available to this authoring session.

Before Step 9 implementation changes any runtime file, the executor must:

1. obtain the exact final Step 8 runtime ZIP named by the Step 8 handoff;
2. read the final Step 8 SHA-256 from the final Step 8 hash inventory;
3. recompute the ZIP SHA-256 locally;
4. require exact equality;
5. record the verified value in the Step 9 evidence ledger.

If the artifact hash cannot be verified, Step 9 implementation must not start.

This is an execution-input binding, not a placeholder requirement in this design.

### 2.3 Frozen academic authority

Step 9 must not change Step 7 academic content or policy.

The official academic source remains the Step 7 canonical source and the frozen content pack remains authoritative for:

- 8 official MS1 categories;
- 5 official level codes;
- 40 official category/level criterion cells;
- canonical provenance;
- English-first source authority;
- optional source-backed VI assistance;
- source-backed subject examples;
- the teacher-decision boundary.

Step 9 never becomes an academic decision engine.

---

## 3. Scope

### 3.1 In scope

Step 9 owns:

- one live Teacher Support lifecycle owner;
- startup and disposal;
- route/class/grid/context invalidation;
- fresh semantic snapshot acquisition;
- stale-result rejection;
- guide/resume orchestration;
- connection from existing resolver/controller output to Step 8 UI view models;
- verified native target resolution;
- sanitized geometry measurement;
- protected native interaction geometry collection;
- spotlight/target-hint wiring;
- bounded event/observer registration;
- manifest activation of the frozen Step 8 UI and new Step 9 integration files;
- deterministic runtime stress tests;
- static safety/performance gates;
- authorized live PowerTeacher smoke validation;
- final packaging, hashing, rollback evidence, and handoff.

### 3.2 Explicitly out of scope

Step 9 must not:

- redesign the Step 8 UI;
- add a new teacher-facing goal;
- add a new guide;
- create fake future workflows;
- change MS1 wording or content;
- infer or recommend EE, AE, ME, BE, or WB;
- create grade thresholds, formulas, or defaults;
- auto-click native PowerTeacher controls;
- call native click, dispatchEvent, or synthetic input;
- type into native fields;
- select a native grade;
- execute Fill Down or Fill Across;
- Save, Publish, Send, Undo, Recalculate, or mutate SIS state;
- add analytics or telemetry;
- add a backend, CDN, external runtime dependency, or network call;
- add a new persistence key for teacher skill, guide progress, class identity, student identity, score, or academic judgement;
- refactor unrelated R4/Hub features;
- merge to main;
- publish a Store package;
- declare production readiness.

---

## 4. Architectural decision

### 4.1 Selected approach: Thin Integration Wedge

Step 9 must use a thin integration layer.

The existing layers keep their existing responsibilities:

~~~text
PowerTeacher live page
        |
        v
PowerTeacher UI contract / read-only adapter
        |
        v
sanitized semantic snapshot
        |
        v
existing state resolver / workflow registry / controller
        |
        v
source-backed content policy
        |
        v
STEP 9 support runtime
        |
        v
generic Step 8 interaction/view models
        |
        v
frozen Step 8 UI
~~~

The Step 9 runtime coordinates these layers. It must not duplicate them.

### 4.2 Rejected architecture: runtime as policy engine

Do not move route interpretation, MS1 eligibility, academic eligibility, content policy, grading policy, or placement policy into support-runtime.js.

That would create a second source of truth and a future god object.

### 4.3 Rejected architecture: broad observer engine

Do not make broad DOM observation the primary architecture.

In particular, reject:

- MutationObserver(document.body);
- continuous document scanning;
- setInterval polling;
- recurring requestAnimationFrame loops;
- render-on-every-mutation behavior.

Live PowerTeacher invalidation must be event-driven and bounded.

---

## 5. Planned runtime delta

Normal Step 9 implementation is authorized to make this runtime delta from the exact frozen Step 8 runtime:

### 5.1 Add

~~~text
modules/teacher-support/platform/powerteacher/runtime-targets.js
modules/teacher-support/runtime/support-runtime.js
modules/teacher-support/bootstrap/powerteacher.js
~~~

### 5.2 Modify

~~~text
manifest.json
~~~

The manifest modification is limited to activating the exact already-frozen Teacher Support UI plus the new Step 9 integration files on the already-approved PowerTeacher content-script boundary.

Normal Step 9 must not add host permissions, extension permissions, externally connectable behavior, background permissions, network permissions, or a broader URL match.

### 5.3 Frozen by default

All Step 5-8 runtime files other than manifest.json remain byte-identical in the normal path, including the five Step 8 generic UI files.

If a frozen Step 5-8 interface proves incapable of safe Step 9 integration, do not silently edit it. Persist a minimal failing RED test, document the exact interface defect, and treat the required frozen-file change as a specification deviation requiring explicit review before implementation.

This rule prevents opportunistic refactoring disguised as integration work.

---

## 6. Runtime component contracts

### 6.1 runtime-targets.js

This file is the only new Step 9 layer allowed to know live target/geometry details beyond the existing read-only adapter.

Responsibilities:

- consume the existing PowerTeacher UI contract and adapter;
- resolve a semantic target key to a currently verified visible native element;
- map current selected standard/header targets by relative semantic position, never fixed absolute cell index;
- measure a verified target into a sanitized rectangle;
- collect bounded protected native-interaction rectangles only when placement requires them;
- expose no raw student, teacher, section, person, user, email, token, cookie, score, grade, or comment data;
- return null/fail-closed on ambiguous, hidden, detached, stale, or unsupported targets.

It must not:

- perform a native action;
- own business rules;
- own UI;
- persist DOM nodes across context epochs;
- serialize native DOM;
- log sensitive native text;
- guess unsupported selectors.

For target kinds not backed by existing contract evidence or new Step 9 verified live evidence, return no target and use a safe explanatory fallback.

### 6.2 support-runtime.js

This is the sole Teacher Support lifecycle owner.

Responsibilities:

- create one runtime session;
- own current context epoch;
- register and remove all Step 9 listeners/observers;
- coalesce invalidation signals;
- call the semantic adapter once per reconcile;
- call existing resolver/controller/policy APIs;
- convert resolved state into the generic models expected by Step 8;
- request target/geometry data from runtime-targets.js;
- invoke Step 8 render/update/clear/destroy APIs;
- reject stale results;
- clear transient UI on unsupported/uncertain state;
- fully dispose.

It must not create a second policy engine, second placement solver, or second content system.

### 6.3 bootstrap/powerteacher.js

Bootstrap is intentionally small.

Responsibilities:

- verify the approved host/path boundary;
- instantiate dependencies in deterministic load order;
- ensure only one support-runtime instance exists;
- call start once;
- expose only the minimum test/debug lifecycle surface required by verification;
- dispose cleanly on explicit teardown.

Bootstrap must not contain business logic, selectors, academic logic, or placement logic.

### 6.4 Step 8 UI ownership

Step 8 remains the only owner of its own UI nodes.

Step 9 must not create a second:

- entry button;
- assistant panel;
- Score Inspector;
- target hint;
- Teacher Support root.

Exactly one extension-owned Teacher Support root may exist.

---

## 7. Lifecycle state machine

Use an explicit lifecycle model:

~~~text
STOPPED
  |
  | start
  v
OBSERVING
  |
  | relevant invalidation
  v
DIRTY
  |
  | coalesced reconcile
  v
RESOLVING
  |                    |
  | supported/safe     | unsupported/uncertain
  v                    v
ACTIVE              PASSIVE
  |                    |
  +------ invalidation-+
             |
             v
            DIRTY

ANY STATE
  |
  | dispose
  v
STOPPED
~~~

### 7.1 Idempotency

Repeated start calls must not multiply runtime resources.

~~~text
start
start
start
~~~

must still yield:

~~~text
1 runtime owner
1 listener registry
at most 1 allowed scoped observer per approved observed container
1 Teacher Support root when UI is mounted
~~~

Repeated dispose calls must be harmless.

After final dispose:

~~~text
0 runtime-owned event listeners
0 connected runtime-owned observers
0 queued runtime-owned reconcile work
0 transient target hint
0 stale semantic snapshot retained for future reuse
0 extra Teacher Support root
~~~

---

## 8. Context epoch and stale-state safety

### 8.1 Problem

PowerTeacher may change class/context while the normalized route remains the same. The MS1 filter may also remain populated across class changes.

Therefore none of these alone proves current academic context:

- route string;
- persisted filter value;
- previous selected standard;
- previous target node;
- previous target geometry.

### 8.2 Epoch rule

Maintain an in-memory monotonically increasing context epoch.

Any context-invalidating event changes:

~~~text
epoch N -> epoch N+1
~~~

Every reconcile/deferred operation captures its starting epoch.

Before applying a result:

~~~text
resultEpoch must equal currentEpoch
~~~

If not equal, discard the result without rendering it.

### 8.3 Epoch-invalidating signals

At minimum:

- hashchange;
- popstate;
- verified course/class semantic change;
- verified Standards-grid replacement;
- selected native academic context invalidation;
- transition from supported to unsupported semantic state;
- explicit runtime reset/dispose.

### 8.4 What must be cleared on epoch change

Immediately invalidate:

- previous selected strand;
- previous Score Inspector eligibility;
- previous native target node;
- previous target geometry;
- previous target hint;
- stale resume position if it is no longer valid in the new semantic state;
- any pending apply step from an older epoch.

Ephemeral generic UI preferences such as the current open/closed panel state may survive only if they carry no academic/native context and the Step 8 contract permits it.

---

## 9. Event and observation strategy

### 9.1 Always-allowed signals

Use:

- hashchange;
- popstate;
- extension-owned UI intents;
- bounded native interaction signals only when required for semantic invalidation.

### 9.2 Scoped MutationObserver exception

Step 9 may use MutationObserver only when necessary to detect live PowerTeacher changes that do not emit a reliable route event.

Allowed observers must satisfy all of the following:

- never observe document.body;
- attach only to the smallest verified stable native container required for class/course or Standards-grid invalidation;
- callback performs invalidate only;
- callback does not perform resolver work, geometry scans, or rendering;
- mutations are coalesced before reconcile;
- observer is disconnected when its container is no longer current and on dispose;
- observer count remains bounded and deterministic.

A normal implementation should require no more than the minimal course-context and Standards-surface observation necessary to detect same-route class/grid replacement.

### 9.3 Forbidden scheduling

Reject:

- setInterval;
- polling loops;
- recurring requestAnimationFrame;
- recursive timeout loops;
- continuous geometry measurement;
- render-on-every-mutation.

One-shot queueing used only to coalesce a dirty state is permitted.

---

## 10. Reconcile algorithm

All external/native signals call invalidate. They do not render directly.

The conceptual algorithm is:

~~~text
invalidate(reason)
  -> mark dirty
  -> increment epoch when reason invalidates semantic context
  -> schedule at most one reconcile

reconcile()
  -> capture epoch
  -> read one fresh sanitized semantic snapshot
  -> resolve existing workflow/state/policy once
  -> if epoch changed, discard
  -> compute semantic fingerprint
  -> if no material change, avoid unnecessary UI rerender
  -> if supported, build generic Step 8 model
  -> resolve only the currently needed native target/geometry
  -> if target/geometry unsafe or stale, omit target hint
  -> render/update Step 8 UI
  -> if unsupported/uncertain, clear academic/transient surfaces and remain passive
~~~

### 10.1 Performance invariants

Per reconcile:

- at most one primary semantic snapshot read;
- no repeated full-document scan;
- geometry collection only when an open/visible UI state needs placement or a target hint;
- no native protected-rect collection while all Teacher Support UI is closed and no hint is active;
- no rerender when semantic fingerprint and generic UI state are materially unchanged;
- no recurring work while idle.

---

## 11. Semantic fingerprint

A fingerprint exists only to avoid redundant work. It must contain sanitized non-identifying semantic state.

Allowed examples:

- allowed route family;
- Standards verified yes/no;
- filter semantic state;
- normalized current rubric category identity when already approved by the existing resolver;
- selected standard relative position;
- native scale signature when needed;
- current workflow step/eligibility state;
- whether a required target is resolvable.

Do not fingerprint:

- student name;
- teacher name;
- email;
- sectionId;
- person/user IDs;
- raw URL query IDs;
- score;
- grade;
- comments;
- SIS payload;
- cookie/token/auth state.

Fingerprint remains in memory only.

---

## 12. Native target mapping

### 12.1 Semantic-key boundary

Step 8 UI may request semantic target kinds such as:

- grading navigation;
- Standards navigation;
- Special Functions / filter controls;
- current rubric header;
- current selected standard cell;
- currently verified native inspector;
- an explicitly verified efficiency feature target.

UI must never know PowerTeacher selectors.

Flow:

~~~text
semantic target key
  -> runtime-targets.js
  -> verified current native element
  -> sanitized rect
  -> Step 8 target/placement model
~~~

### 12.2 Selected-standard mapping

Never use a fixed absolute cellIndex as strand identity.

Map a selected td.standard-col to its current rendered standard header through relative semantic standard-column position, consistent with the existing PowerTeacher adapter contract.

### 12.3 Fill Down / Fill Across

Step 8 represents Fill guidance as a semantic intent only.

Step 9 may:

- resolve a native Fill target only when live evidence verifies it;
- spotlight/explain that verified target;
- fail closed and show a non-targeted explanation when verification is insufficient.

Step 9 may never invoke Fill.

Do not invent a selector merely to make the guide look complete.

---

## 13. Sanitized geometry and non-obstruction

### 13.1 Geometry boundary

Pass only numeric geometry into the Step 8 placement/orchestration layer:

~~~text
viewport
safeInsets
surfaceSize
targetRect
protectedRects
clearance
~~~

Do not pass native DOM nodes into the pure placement solver.

### 13.2 Native protected rectangles

Collect protected native rectangles only from the current relevant PowerTeacher work surface and currently relevant verified targets.

The collection must be bounded, visibility-filtered, and performed only when required for an open opaque/interactive Hub surface.

It must not become a continuous document-wide scanner.

### 13.3 Safety precedence

When no safe placement exists:

~~~text
move
-> compact
-> collapse
-> suspend
~~~

Never overlap a protected native interaction target as a fallback.

### 13.4 Spotlight

The target hint remains:

- extension-owned;
- pointer-transparent;
- non-opaque over the native target;
- non-interactive;
- removed when target becomes invalid, hidden, detached, or stale.

Native pointer, keyboard, scroll, and focus remain available.

---

## 14. Intent handling

Step 8 emits semantic intents. Step 9 interprets them without native automation.

Examples:

~~~text
open
close
guide-step-by-step
help-from-here
quick-reference
explain-this
i-know-already
reference-area
reference-level
assist-language
show-target
efficiency-offer
~~~

The runtime may update Hub-owned ephemeral state and request existing resolver/controller/content output.

It must not translate a Teacher Support intent into a native PowerTeacher mutation.

---

## 15. Onboarding and returning-teacher boundary

Step 8 already supports first-run post-name and returning-teacher presentation models through caller-supplied view models.

Step 9 may consume an existing Hub-owned, non-sensitive onboarding-completion signal only through an already-existing public interface.

Step 9 must not:

- add a new storage key merely to classify first-run/returning behavior;
- read private unrelated storage opportunistically;
- persist teacher skill level;
- infer user technical ability.

If no safe existing public signal is available, default to the neutral returning/entry presentation rather than coupling to private storage internals.

This does not block the core Step 9 runtime.

---

## 16. Privacy and data minimization

Step 9 is read-only and ephemeral.

Do not persist or transmit:

- student identity;
- teacher identity;
- course/section raw IDs;
- person/user IDs;
- emails;
- scores;
- grades;
- comments;
- SIS payloads;
- selected academic judgement;
- teacher technical-skill classification;
- cookies;
- auth tokens.

Do not add network calls, analytics, telemetry, or external logging.

Do not log native text that may contain identity or academic data.

Test fixtures must remain sanitized.

---

## 17. Fail-closed behavior matrix

| Condition | Required behavior |
| --- | --- |
| Unsupported host/path | Do not activate Teacher Support runtime |
| Supported host but unsupported route/state | Passive entry behavior only if contract permits; no academic surface |
| Standards state unverified | No academic inspector |
| Generic MS1 text only | No rubric eligibility |
| Known MS1 look-alike | No rubric eligibility |
| Selected cell ambiguous | No contextual inspector |
| Native scale ambiguous | No contextual inspector |
| Current header/category ambiguous | No academic content |
| Native target missing | No spotlight |
| Native target hidden/detached | Clear spotlight |
| Geometry invalid | Do not place against it |
| No safe UI placement | Collapse/suspend |
| Context epoch stale | Discard result |
| Adapter/target resolver throws | Clear transient help; keep PowerTeacher untouched |
| Step 8 robot/image fails | Preserve textual guidance |
| Runtime integration fails | Native PowerTeacher remains usable |
| Fill target unverified | Explain without spotlight |
| Onboarding signal unavailable | Use neutral entry model; do not inspect private storage |

No best-guess academic or native action fallback is permitted.

---

## 18. Risk model

### R1 — Native interference

**Severity:** Critical

Failure examples:

- Hub panel covers native grading control;
- invisible layer intercepts click;
- keyboard focus cannot return to PowerTeacher;
- scrolling is locked.

Controls:

- frozen Step 8 non-obstruction contract;
- bounded protected rectangles;
- pointer-transparent hint;
- move/compact/collapse/suspend precedence;
- no backdrop/click catcher/focus trap/page scroll lock.

Pass condition:

~~~text
0 unsafe native obstruction
~~~

### R2 — Stale academic context

**Severity:** Critical

Failure examples:

- teacher changes class but old strand/inspector remains;
- persisted MS1 filter falsely preserves eligibility;
- old deferred target result is applied after route/context transition.

Controls:

- epoch invalidation;
- fresh snapshot after context change;
- stale-result discard;
- no route-only or filter-only trust.

Pass condition:

~~~text
0 stale academic leakage
~~~

### R3 — Lifecycle duplication/leak

**Severity:** Critical

Failure examples:

- duplicate entry buttons;
- duplicate panels;
- multiple runtime instances;
- orphan target hints;
- listener/observer growth.

Controls:

- sole runtime owner;
- idempotent start/dispose;
- centralized resource registry;
- soak testing.

Pass condition:

~~~text
1 owner while active
0 residual runtime resources after dispose
~~~

### R4 — Performance degradation

**Severity:** High

Failure examples:

- mutation storm triggers repeated expensive reads;
- idle periodic work;
- repeated unnecessary geometry scans;
- full-document traversal on every event.

Controls:

- invalidate/coalesce/reconcile;
- one primary semantic read per reconcile;
- bounded observation;
- geometry only when needed;
- fingerprint-based no-op;
- no polling/recurring RAF.

Pass condition:

~~~text
idle recurring work = 0
mutation/event bursts remain bounded
~~~

### R5 — Academic authority leakage

**Severity:** Critical

Failure examples:

- ME appears selected/default;
- Hub says which grade is correct;
- reference choice writes to native SIS.

Controls:

- frozen Step 7 policy/content;
- generic Step 8 inspector;
- no native write action;
- no new grading logic in runtime.

Pass condition:

~~~text
0 inferred grade
0 automatic academic decision
0 native grade write
~~~

### R6 — Scope/architecture drift

**Severity:** High

Failure examples:

- Codex refactors old runtime for cleanliness;
- selectors leak into UI;
- placement logic duplicated in runtime;
- frozen Step 8 UI modified unnecessarily.

Controls:

- exact runtime allowlist;
- frozen-file deviation gate;
- minimal causal delta;
- independent architecture review.

### R7 — Privacy leakage

**Severity:** Critical

Failure examples:

- student/course identifiers stored;
- native text logged;
- telemetry introduced.

Controls:

- sanitized snapshot contract;
- ephemeral state;
- no new storage/network;
- static scans.

### R8 — Manifest/activation regression

**Severity:** High

Failure examples:

- broader host match;
- new permissions;
- wrong script load order;
- duplicate bootstrap.

Controls:

- manifest-specific tests;
- exact diff gate;
- load-order verification;
- re-extracted-package smoke.

---

## 19. Deterministic stress-test plan

Stress harnesses must be seeded/deterministic and produce compact summaries rather than verbose per-case output.

On failure, print only:

- seed;
- failing case index;
- minimal input;
- expected result;
- actual result;
- at most the first small bounded set of failures.

Do not dump all generated cases.

### 19.1 Lifecycle soak

Run at least:

~~~text
500 deterministic lifecycle cycles
~~~

Mix:

- start;
- open;
- close;
- reopen;
- reconcile;
- invalidate;
- supported/passive transitions;
- dispose.

Required:

~~~text
0 root growth
0 listener growth
0 observer growth
0 pending-work growth
0 orphan hint
0 stale retained context
~~~

### 19.2 Invalidation storm

Generate:

~~~text
10,000 invalidation signals
~~~

in deterministic synchronous and burst patterns.

Assert:

- duplicate signals coalesce;
- no recursive render loop;
- reconcile count is bounded by coalescing boundaries, not signal count;
- final state equals the last valid semantic state;
- no final update is lost.

Output summary only:

~~~text
signals
coalescing windows
reconciles
final fingerprint
failures
~~~

### 19.3 Context epoch churn

Run at least:

~~~text
1,000 deterministic context transitions
~~~

Include:

- A -> B;
- B -> A;
- same route, class semantic change;
- supported -> unsupported;
- eligible -> ineligible;
- selected -> none;
- current rubric -> look-alike;
- old deferred result arriving after new epoch.

Required:

~~~text
0 stale result applied
0 stale inspector
0 stale target hint
~~~

### 19.4 Target-disappearance stress

Repeatedly simulate:

~~~text
target exists
-> geometry measured
-> target disappears/replaces
-> old geometry/result returns
~~~

Required:

- old geometry never reactivates a hint after epoch/target invalidation;
- no orphan hint remains.

### 19.5 Route/class/grid pairwise matrix

Use pairwise coverage rather than an uncontrolled Cartesian explosion.

Dimensions include:

- route supported/unsupported;
- same-route class switch yes/no;
- MS1 filter persisted/cleared;
- rubric/look-alike/mixed headers;
- selected cell valid/none/ambiguous;
- inspector native scale valid/invalid/closed;
- grid replaced/stable;
- target present/missing.

The purpose is maximum interaction coverage with bounded execution and compact evidence.

### 19.6 Placement/non-obstruction replay

Reuse the frozen Step 8 deterministic placement stress suite.

Final Step 9 gate requires the existing:

~~~text
10,000 placement cases
0 unsafe placements
~~~

Do not create a second placement fuzz framework.

Do not rerun the full placement stress after every Step 9 task if the placement solver contract and files remain unchanged. Rerun it:

- at the final Step 9 engineering gate;
- immediately after any authorized change affecting placement/geometry semantics.

### 19.7 Static stress/safety scan

Reject in Step 9 runtime source unless explicitly allowed by this spec:

- native click invocation;
- dispatchEvent;
- synthetic typing/input;
- grading mutation verbs tied to native action;
- setInterval;
- recurring requestAnimationFrame;
- MutationObserver(document.body);
- network APIs;
- analytics/telemetry;
- new storage writes;
- raw identifiers/payload persistence;
- broad host permission change;
- second Teacher Support root owner;
- duplicated placement algorithm.

Allow only narrowly scoped MutationObserver usage that conforms to Section 9.

---

## 20. Verification strategy

### 20.1 Targeted verification during implementation

Run only the smallest sufficient affected suite after a local change.

Examples:

~~~text
support-runtime change
-> runtime contract + lifecycle tests

runtime-targets change
-> target/geometry + runtime tests

manifest/bootstrap change
-> activation/load-order + runtime tests

verification-only test change
-> that test family
~~~

Do not automatically run all 300 frozen tests plus every stress suite after each small edit.

### 20.2 Batch gates

The implementation plan should group work into four batches:

~~~text
Batch A
authority freeze + RED runtime contract

Batch B
runtime lifecycle + target/geometry integration

Batch C
invalidation/epoch/re-entry + stress

Batch D
full regression + independent review + live smoke + packaging/handoff
~~~

Run broad regression at batch boundaries only when the changed dependency set makes it meaningful.

### 20.3 Final engineering gate

Before live validation, require:

- Step 9 focused tests PASS;
- 500-cycle lifecycle soak PASS;
- 10,000-signal invalidation stress PASS;
- 1,000-transition epoch stress PASS;
- target-disappearance stress PASS;
- pairwise route/class/grid matrix PASS;
- frozen Step 8 placement 10,000 cases with 0 unsafe placements;
- frozen Step 7/8 regression suites PASS against the Step 9 candidate;
- syntax checks PASS;
- static safety/privacy/performance scan PASS;
- manifest scope/load-order exact-diff gate PASS;
- no unauthorized frozen Step 5-8 runtime changes;
- independent whole-Step-9 review has no unresolved Critical/Important issue.

Passing this gate permits only:

~~~text
STEP 9 ENGINEERING COMPLETE - AWAITING AUTHORIZED LIVE VALIDATION
~~~

It does not permit a live PASS claim.

---

## 21. Authorized live PowerTeacher validation

Live validation is teacher/user driven or performed only in an explicitly authorized session.

The extension itself remains read-only.

### 21.1 Core smoke sequence

Validate at minimum:

1. load/reload the Step 9 candidate extension;
2. open the allowed PowerTeacher teachers surface;
3. confirm native page loads normally;
4. confirm one Teacher Support entry only;
5. open/close/reopen assistant;
6. exercise Guide me step by step;
7. exercise Help me from here;
8. exercise Quick reference;
9. exercise Explain this in eligible and ineligible states;
10. verify I know already changes only Hub presentation;
11. manually navigate Grading -> Standards;
12. manually show/use native filter;
13. manually search MS1;
14. traverse/paginate Standards columns if available;
15. select a rubric standard/cell manually where authorized;
16. verify contextual inspector only when semantic eligibility is valid;
17. change class while remaining on the same normalized route;
18. verify old inspector/target context disappears immediately;
19. change route away and back;
20. reload;
21. use native pointer, keyboard, focus, and scrolling while Hub is open;
22. verify no native control is obscured or intercepted;
23. exercise verified spotlight targets;
24. verify missing/unverified target produces safe fallback, not guessed spotlight;
25. inspect console for Step 9 runtime errors.

### 21.2 Live pass conditions

Require:

~~~text
1 runtime owner
1 Teacher Support root
1 entry button
0 duplicate panel/inspector/hint
0 stale academic context
0 unsafe overlap
0 blocked native click
0 blocked native keyboard/focus
0 blocked native scroll
0 automatic native action
0 runtime error
~~~

### 21.3 Live failure handling

Any live failure must follow:

~~~text
capture minimal sanitized evidence
-> reproduce deterministically if possible
-> persist RED regression
-> fix minimum causal delta
-> rerun affected suite
-> rerun required final gate subset
-> repeat the failed live scenario
~~~

Do not respond to a live defect with broad refactoring.

---

## 22. Manifest activation rules

Step 9 is the first step allowed to activate the frozen Step 8 UI in live PowerTeacher runtime.

Manifest changes must:

- stay on the existing approved PowerTeacher content-script match;
- load existing semantic/platform/content/controller dependencies before consumers;
- load frozen Step 8 UI dependencies before support-runtime/bootstrap;
- load bootstrap last;
- include the frozen Step 8 Teacher Support CSS through the existing content-script mechanism;
- introduce no new permission or broader match;
- introduce no duplicate content-script injection.

Exact script order must be derived from the frozen Step 8 artifact during implementation and pinned by a deterministic manifest test.

---

## 23. Token/quota-efficient Codex execution contract

Quota efficiency is the fifth priority, after correctness, safety, evidence, and recoverability.

### 23.1 Priority order

When trade-offs exist:

1. correctness and source-of-truth fidelity;
2. safety and non-regression;
3. required verification and deterministic evidence;
4. recoverability and complete handoff;
5. quota/token efficiency.

Never skip a required safety gate to save tokens.

### 23.2 Authority manifest

At execution start, Codex must create/use a compact authority manifest equivalent to:

~~~text
READ ONCE
- final Step 8 handoff
- approved Step 9 spec
- approved Step 9 implementation plan

VERIFY ONCE
- Step 8 final artifact SHA
- frozen regression artifact availability
- current branch/worktree state

LOAD ON DEMAND
- only source/interface/test files needed by the current task

DO NOT REREAD WITHOUT INVALIDATION
- historical drafts
- superseded plans
- old chats
- unchanged source files already summarized in the task ledger
~~~

### 23.3 Evidence ledger

Maintain a compact evidence ledger with:

~~~text
gate
input/dependency hash or commit
result
affected-by
still-valid
rerun-required
~~~

Reuse prior PASS evidence only when its dependencies remain unchanged.

### 23.4 Impact-based test selection

Use dependency impact to choose tests during implementation.

Do not use:

~~~text
tiny edit
-> all frozen regression
-> all stress
-> package
~~~

Use:

~~~text
tiny edit
-> focused affected test
-> batch gate later
~~~

### 23.5 Compact task records

After a normal task, record only:

~~~text
TASK
FILES
TEST
RESULT
NEW RISK
NEXT
~~~

Do not produce a full narrative handoff after each subtask.

### 23.6 Subagent policy

Do not spawn a subagent for every small task.

Use sequential implementation for shared runtime files.

Use fresh independent reviewers only where they materially improve safety:

1. runtime/lifecycle architecture review;
2. stress/safety review;
3. final whole-Step-9 review.

Parallel execution is permitted only for read-only independent review/test work that does not share mutable implementation state.

### 23.7 Reasoning escalation

Use normal/medium reasoning for straightforward:

- fixture work;
- test scaffolding;
- deterministic wiring;
- manifest checks;
- packaging.

Use high reasoning only for:

- lifecycle architecture;
- stale-state/concurrency defect;
- safety/non-obstruction finding;
- unexplained failing test;
- final critical review.

Do not use maximum reasoning by default.

### 23.8 Stress-output compression

Stress tests must emit compact summaries.

Do not print 10,000 generated cases.

On success, one summary is enough.

On failure, emit only a bounded first-failure sample sufficient to reproduce.

### 23.9 Compaction/resume rule

Before context compaction or when quota becomes tight, preserve:

- current batch/task;
- exact changed files;
- last green tests;
- current failing test if any;
- authority hashes/commit;
- next command/action;
- deviations/risks.

After compaction:

- continue from the recorded checkpoint;
- do not restart discovery;
- do not reread unchanged authority artifacts unless the ledger marks them invalid;
- do not rerun green gates unless affected.

---

## 24. Independent review requirements

A fresh reviewer must assess at minimum:

1. sole lifecycle ownership and idempotency;
2. context epoch correctness and stale-result rejection;
3. same-route class-switch behavior;
4. observer/event boundedness;
5. native target mapping and selector leakage;
6. non-obstruction/pointer/focus/scroll preservation;
7. academic eligibility leakage;
8. accidental native-action capability;
9. privacy/data minimization;
10. manifest activation/load order;
11. performance/idle behavior;
12. unauthorized frozen-file edits;
13. token-efficiency plan does not remove required verification.

Every Critical or Important finding requires:

- a persisted RED regression;
- minimal causal fix;
- affected-suite rerun;
- scoped re-review;
- final gate rerun where dependencies require it.

Do not silently waive a load-bearing finding.

---

## 25. Packaging and artifacts

Expected final Step 9 artifacts:

~~~text
STEP_09_R4_PLUS_LIVE_TEACHER_SUPPORT_RUNTIME.zip
STEP_09_R4_PLUS_LIVE_TEACHER_SUPPORT_RUNTIME_HANDOFF.md
STEP_09_VERIFICATION.zip
STEP_09_FINAL_ARTIFACTS_SHA256.txt
STEP_09_LIVE_VALIDATION_REPORT.md
~~~

If live validation has not yet occurred, use an engineering candidate package and do not create a report that claims live PASS.

Final packaging sequence:

1. verify exact frozen Step 8 input hash;
2. run final engineering gates;
3. perform independent review;
4. package complete runtime, not a patch;
5. re-extract;
6. byte-compare candidate vs extracted runtime;
7. rerun required focused/frozen suites against the re-extracted runtime;
8. perform or record authorized live validation;
9. write final handoff;
10. compute final SHA-256 inventory.

---

## 26. Rollback

Primary rollback is the exact final Step 8 runtime artifact verified at Step 9 intake.

Rollback requires no SIS data migration because Step 9 writes no SIS data and introduces no new Teacher Support persistence.

The Step 9 handoff must record:

- exact Step 8 rollback artifact name;
- verified Step 8 SHA-256;
- exact Step 9 final artifact SHA-256;
- exact runtime delta;
- manifest delta;
- how to restore/reload the Step 8 package.

---

## 27. Completion states

### 27.1 Engineering complete only

Use only when deterministic/static/package gates pass but live PowerTeacher validation is pending:

~~~text
STEP 9 ENGINEERING COMPLETE - AWAITING AUTHORIZED LIVE VALIDATION
~~~

### 27.2 Live integration pass

Use only after authorized live validation satisfies Section 21:

~~~text
STEP 9 LIVE RUNTIME INTEGRATION PASS - READY FOR CONVERGENCE REVIEW
~~~

### 27.3 Forbidden completion claim

Do not label Step 9:

~~~text
PRODUCTION READY
~~~

Production/release convergence is a separate decision after Step 9.

---

## 28. Acceptance criteria

Step 9 is accepted only if all of the following are evidenced:

1. exact final Step 8 artifact is hash-verified before implementation;
2. Step 9 normal runtime delta is limited to three new integration files plus manifest activation;
3. no frozen Step 5-8 runtime file is modified except the explicitly authorized manifest delta;
4. support-runtime.js is the sole Teacher Support lifecycle owner;
5. exactly one Teacher Support root exists;
6. repeated start/dispose is idempotent;
7. same-route class switches invalidate old academic context;
8. persisted MS1 filter does not carry academic eligibility across context changes;
9. stale epoch results are never applied;
10. current standard mapping is relative/semantic, never fixed absolute cell index;
11. unsupported/ambiguous state fails closed;
12. native target mappings are verified and never guessed;
13. Fill guidance never invokes Fill;
14. no native click/type/grade/Save/Publish/Send action exists;
15. no academic band is inferred, defaulted, or recommended;
16. Step 7 content/policy remains frozen;
17. Step 8 UI remains frozen in the normal path;
18. Step 8 non-obstruction contract remains intact;
19. no native pointer/keyboard/focus/scroll obstruction occurs;
20. no broad body observer, polling, recurring RAF, or continuous scan exists;
21. no recurring runtime work occurs while idle;
22. geometry collection is bounded and on-demand;
23. privacy/data-minimization rules pass;
24. 500 lifecycle cycles produce zero growth/leak;
25. 10,000 invalidation signals remain safely coalesced/bounded;
26. 1,000 context transitions produce zero stale application;
27. target-disappearance stress leaves zero orphan hint;
28. pairwise route/class/grid matrix passes;
29. frozen Step 8 10,000-placement stress remains zero unsafe placement;
30. frozen regression suites remain green;
31. manifest scope/load-order tests pass with no new permissions/broader match;
32. final package re-extraction and replay verification pass;
33. independent review has no unresolved Critical/Important finding;
34. authorized live PowerTeacher smoke passes before live PASS is claimed;
35. final SHA inventory and complete handoff exist;
36. rollback to exact Step 8 artifact is documented;
37. final live status, when earned, is exactly STEP 9 LIVE RUNTIME INTEGRATION PASS - READY FOR CONVERGENCE REVIEW.

---

## 29. Review gate

This written specification is now the proposed Step 9 design authority.

Do not write or execute the Step 9 implementation plan until the user explicitly approves this written specification.

After approval, invoke Superpowers writing-plans and produce:

- a detailed TDD-first implementation plan;
- exact planned files and interfaces;
- four quota-efficient execution batches;
- targeted test commands;
- deterministic stress commands and compact evidence format;
- frozen-regression dependency rules;
- independent review points;
- live-validation checklist;
- packaging/handoff sequence;
- Codex low-quota execution playbook.

Implementation remains unauthorized until that implementation plan is subsequently reviewed and its execution method is selected.
