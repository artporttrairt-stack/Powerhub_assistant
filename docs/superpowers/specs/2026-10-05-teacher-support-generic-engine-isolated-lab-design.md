# Teacher Support Generic Engine + Isolated Lab — Architecture Design

**Date:** 2026-10-05  
**Status:** WRITTEN SPEC FOR USER REVIEW — FOUR APPROVED ARCHITECTURE CORRECTIONS APPLIED  
**Repository:** `artporttrairt-stack/Powerhub_assistant`  
**Implementation branch:** `feature/ms1-isolated-lab`  
**Starting branch HEAD:** `946b13e1c6819f80cb444168520c4238cceaf67c`  
**Protected base:** `main @ bcd9cb7996247c1f32706c9b41449ac947e7bb15`

## 1. Decision

Use **Generic Engine + Isolated Lab**.

Teacher Support is implemented once as a generic engine. MS1 is the first workflow/content pack, not the architecture itself. The isolated MS1 Lab packages the generic engine plus the MS1 pack for development and live validation without changing the production manifest/runtime.

This design supersedes only the earlier `extension/modules/ms1/` file-layout decision. It does **not** replace the approved academic source rules, PowerTeacher DOM evidence, teacher-control constraints, accessibility rules, MS1 behavior, or fail-closed requirements from the approved MS1 Final Spec.

### 1.1 Normative inheritance from the approved MS1 Final Spec

The normative inherited specification is:

`docs/superpowers/specs/2026-10-04-ms1-isolated-lab-design.md @ a56ceafa3d022042c87b178243f51e058efcc8a0`

This Generic Engine design changes only the canonical module layout and shared architecture boundary. The following Final Spec areas remain binding unless a later explicitly approved specification replaces them:

- source authority, source precedence, and the EN/VI language-system boundary;
- verified PowerTeacher facts and the G0 D0-D8 DOM evidence/contract;
- floating entry, assistant-panel, Error Bot, walkthrough, and teacher-led interaction behavior;
- the exact strand-local, pagination-aware MS1 academic gate;
- contextual Score Inspector behavior, level-reference controls, subject overlays, and teacher-final-decision lock;
- official 8 x 5 wording/provenance integrity and derived-content rules;
- route/class invalidation and stale-context rules;
- performance, privacy/security, accessibility, motion, deterministic-test, and authorized live-validation requirements;
- teacher-control prohibitions, including no native click/typing/event synthesis and no grade/Fill/Save/Publish/Send mutation.

If this design and the inherited Final Spec appear to conflict outside the architecture/file-layout changes explicitly authorized here, the inherited Final Spec governs. This design may strengthen isolation/performance boundaries, but it may not weaken an inherited safety, academic, accessibility, privacy, or teacher-control requirement. Ambiguity fails closed and must be resolved in writing rather than silently reinterpreted during implementation.

## 2. Goals

1. Keep the source tree easy to understand and extend.
2. Avoid duplicating platform adapters, lifecycle code, UI shells, state logic, and listeners for future Baseline / EOS / Unit Quiz / MS2 / EOY packs.
3. Keep idle performance near zero: no polling, no recurring work, no broad DOM observation.
4. Keep MS1 isolated from production until deterministic and authorized live validation pass.
5. Preserve existing protected Phase 0 production files during the Lab phase.
6. Keep R4 as a UX/behavior reference only; do not merge reconstructed `sis/` runtime into the modular product tree.
7. Converge toward one canonical Teacher Support engine; do not create a long-lived second registry/lifecycle beside the protected Phase 0 foundation.

## 3. Canonical source tree

```text
extension/
└── modules/
    └── teacher-support/
        ├── core/
        │   ├── workflow-registry.js
        │   ├── state-resolver.js
        │   └── support-controller.js
        │
        ├── platform/
        │   └── powerteacher/
        │       ├── ui-contract.js
        │       └── ui-adapter.js
        │
        ├── runtime/
        │   └── support-runtime.js
        │
        ├── ui/
        │   ├── entry-button.js
        │   ├── assistant-panel.js
        │   ├── score-inspector.js
        │   └── teacher-support.css
        │
        └── packs/
            └── cam-primary/
                └── ms1/
                    ├── index.js
                    ├── applicability.js
                    ├── sources.js
                    └── content/
                        ├── official.js
                        ├── guidance.js
                        ├── locale.js
                        └── examples.js

tests/
└── teacher-support/
    ├── core/
    ├── platform/
    ├── runtime/
    ├── ui/
    └── packs/
        └── cam-primary/
            └── ms1/

tools/
└── build-ms1-lab.mjs

dist/
└── ms1-lab/                  # generated only; never canonical source
```

### 3.1 File ownership

- `core/`: generic workflow selection, pure state decisions, orchestration policy. No PowerTeacher selectors, MS1 strings, DOM ownership, timers, or storage.
- `platform/powerteacher/`: read-only conversion of verified PowerTeacher DOM/state into a sanitized semantic snapshot. No presentation and no academic decision.
- `runtime/`: the only owner of page lifecycle integration and native route/class event subscriptions.
- `ui/`: extension-owned DOM only. It consumes view models and emits user intent; it does not inspect PowerTeacher DOM directly.
- `packs/`: workflow-specific data, applicability/availability, pure workflow policy, source authority, and content. Packs do not own listeners, timers, platform DOM, or native actions.
- `tools/build-ms1-lab.mjs`: deterministic development builder. It packages the generic engine + MS1 pack + local approved asset into `dist/ms1-lab` without changing production runtime files.

## 4. Generic interfaces

### 4.1 Workflow registry

```js
createWorkflowRegistry()
register(pack)
get(id)
list()
select(context)
```

`select(context)` answers **workflow-pack availability/selection only**. It does not grant contextual academic eligibility. A workflow pack may be selected so the engine can offer generic/navigation/reference help before a native rubric cell is safely verified.

Ambiguous multi-pack matches fail closed. Pack selection must never be inferred from a generic filter string alone when the workflow contract requires stronger evidence.

Adding a later reporting pack should not require changes to generic UI/runtime/core unless the new workflow proves a genuinely new generic capability is needed.

### 4.2 PowerTeacher adapter

```js
readTeacherUiState(documentLike, contract)
```

Produces a sanitized semantic snapshot only. It must not expose raw student/teacher identity or raw SIS payloads into the Teacher Support engine.

The adapter is platform-semantic, not MS1-academic. It may report verified Standards/filter/grid/header/cell/scale facts, relative standard-column relationships, visibility, and native inspector state. It must not classify an official MS1 category, decide MS1 eligibility, or contain MS1 source wording/aliases/look-alike rules. Those belong to the selected pack's pure workflow policy.

### 4.3 Pure state resolver

```js
resolveSupportState({ selection, workflowDecision, uiState, context, mode })
```

Pure function: no DOM, storage, network, listeners, timers, or mutation. It maps generic selection + pack-produced pure workflow decisions into generic support states. It must not contain MS1 strings, PowerTeacher selectors, official category names, native scale codes, or pack-specific look-alike rules.

### 4.4 Controller

Consumes registry + semantic snapshot + selected pack policy/content + pure state and creates view models/user-intent decisions. The controller may ask the selected pack for a pure workflow decision/contextual-eligibility result, then pass that result into the generic resolver. It does not attach native page listeners directly.

This creates two explicit gates:

```text
pack availability / workflow selection
        -> generic navigation/reference help may be available

strict pack contextual eligibility
        -> contextual academic guidance may be available
```

For MS1, contextual eligibility remains the inherited Final Spec gate: verified PowerTeacher + verified Standards + current official rubric strand + selected native cell mapped to that strand + exact compatible `EE / AE / ME / BE / WB` scale + fresh context after the latest route/class invalidation. Generic `MS1` text or persisted filter value is never sufficient.

### 4.5 Runtime

`support-runtime.js` is the single lifecycle owner. It owns the approved route/class invalidation subscriptions and may bind at most one delegated native interaction boundary to the **currently verified Standards grid**. That boundary treats only teacher-generated native interaction as a signal for a scoped semantic re-read; it never prevents the native action, synthesizes an event, mutates the native target, or performs academic work itself.

No document-wide click listener is allowed. No `MutationObserver` is required or authorized for the current MS1 Lab contract. On route/class invalidation or grid replacement, the old scoped boundary is detached before any fresh context can become eligible. Duplicate route events for one native transition may be coalesced without polling or recurring timers. The runtime must be fully destroyable.

## 5. MS1 pack structure

Do not create one JavaScript file per level/category or split content into many tiny runtime scripts.

### 5.1 Pack behavioral contract

`index.js` exports the frozen MS1 pack contract. `applicability.js` owns MS1-specific **pure** workflow policy; it does not own DOM reads or lifecycle hooks. The contract must provide, directly or through frozen child objects/functions:

- stable workflow/pack identity (`cam-primary.ms1` / MS1);
- coarse pack availability/applicability separate from contextual academic eligibility;
- the native filter query required by this workflow (`MS1`) as pack data, not a generic-engine constant;
- official-category classification using source-backed official titles and only live-approved aliases;
- explicit MS1 look-alike rejection rules for TA Grade / TA Score / VN Ranking / Unit / LSPC and unknown ambiguous MS1 columns;
- compatible native scale policy for exact `EE / AE / ME / BE / WB`;
- a pure workflow-decision function for navigation/resume behavior;
- a pure contextual-eligibility function implementing the inherited strict academic gate;
- source/provenance and content accessors for official, guidance, locale, and examples data.

The pack receives only sanitized semantic facts from the platform adapter. It attaches zero listeners, reads no DOM directly, owns no timers/storage/network, and performs no native actions.

### `official.js`

Canonical 8 categories × 5 levels = 40 official criterion cells and immutable official identifiers/provenance.

### `guidance.js`

Source-backed plain explanation, classroom evidence, observation prompts/checklists, and adjacent-level comparison.

### `locale.js`

MS1-only interface/support copy for EN/VI where explicitly source-backed. Official academic criterion remains canonical; unsupported Vietnamese academic content is not invented.

### `examples.js`

Source-backed optional subject examples for English / Maths / Science. Unknown subject receives no borrowed example.

This keeps authority boundaries clear without creating file-confetti or long runtime load chains.

## 6. Performance contract

Performance safety is architectural, not a late optimization task.

### Idle-state requirements

When the teacher is not interacting with Teacher Support:

- no polling;
- no `setInterval`;
- no recurring `requestAnimationFrame` work;
- no broad `MutationObserver(document.body)`;
- no continuous full-document scan;
- no network activity introduced by Teacher Support;
- no repeated storage reads/writes introduced by Teacher Support;
- no infinite CSS animation;
- no periodic re-render.

The desired idle model is:

```text
exact PowerTeacher host
      ↓
one small extension-owned entry/root
      ↓
IDLE — no recurring work
      ↓
user action or bounded known lifecycle signal
      ↓
scoped semantic read
      ↓
pure state resolution
      ↓
minimal owned-DOM update
```

### DOM/listener requirements

- Exactly one extension-owned Teacher Support root.
- `support-runtime.js` is the only page-lifecycle listener owner.
- Packs attach zero listeners.
- State resolver attaches zero listeners.
- Platform adapter attaches zero persistent listeners.
- At most one delegated native listener may be attached to the currently verified Standards grid by `support-runtime.js`; no document-wide native click listener is allowed.
- Route/class listeners and the scoped Standards-grid listener are runtime-owned and are removed/rebound as one lifecycle boundary.
- No `MutationObserver` is authorized for the current MS1 Lab contract.
- Prefer delegated handling inside the extension-owned root instead of per-item listener growth.
- Native DOM reads are scoped to the verified PowerTeacher contract and performed only when needed.
- Route/class invalidation clears stale semantic/academic context before a fresh read.
- `destroy()` removes all Teacher Support-owned listeners, overlays, roots, and ephemeral state.

### Rendering requirements

- Keep the 40-cell official matrix as data, not 40 always-mounted DOM cards.
- Render only the current view/area/level plus the minimum adjacent context needed by the teacher.
- Collapse/close removes or reuses owned presentation state without accumulating duplicate nodes.
- Robot/image failure must leave text/actions usable.
- Motion is finite CSS-only and disabled by `prefers-reduced-motion` where required.

## 7. Isolation model

During the MS1 Lab phase:

- canonical new source lives only under `extension/modules/teacher-support/`;
- the production `extension/manifest.json` remains unchanged;
- existing `extension/src/**` remains protected;
- existing `extension/assets/**` remains protected;
- no production Store ZIP is rebuilt;
- no production version is bumped;
- `dist/ms1-lab/` is generated and non-canonical;
- the Lab manifest loads only Teacher Support generic engine files, MS1 pack files, approved local assets, and the exact PowerTeacher teacher host.

Production integration is a separate later decision after deterministic + authorized live Lab PASS.

### 7.1 Phase 0 convergence contract

The protected base already contains a dormant Phase 0 Teacher Support foundation under `extension/src/**`, including the sanitized PowerTeacher context boundary, Teacher Support pack registry, CAM Primary MS1 applicability/source identity/pack stub, and dormant support lifecycle. Those files remain a protected compatibility checkpoint during the Lab phase.

During the MS1 Lab phase:

- `extension/src/**` Phase 0 Teacher Support files remain byte-protected and are not refactored to fit this design;
- the standalone Lab must not import or execute the protected Phase 0 Teacher Support registry/lifecycle as a hidden dependency;
- `extension/modules/teacher-support/` is the forward-canonical implementation for the Generic Teacher Support Engine and complete MS1 pack;
- the Lab manifest loads the canonical module engine directly, not both architectures;
- the Phase 0 foundation and the Generic Engine are not maintained as two independently evolving product implementations.

A later production-integration specification must explicitly converge the production PowerTeacher entrypoint onto **one registry and one lifecycle owner**. It may adapt/retire the dormant Phase 0 entrypoints as migration seams, but it must not leave two independent Teacher Support registries, two academic pack selections, or two page-lifecycle owners running in production. No such migration is authorized by this Lab design.

## 8. R4 relationship

R4 remains frozen at:

`feature/r4-question-attention-stage @ 100302b81ef4cceab7665a27cfa34bbb91846f61`

Use it only as a golden behavior/quality reference for:

- one-shot attention;
- reduced-motion behavior;
- duplicate prevention;
- compact low-cognitive-load interaction;
- Error Bot visual/interaction quality.

Do not import the reconstructed `sis/` architecture or make MS1 depend on the R4 Git lineage.

## 9. Future pack rule

Expected future layout:

```text
packs/cam-primary/ms1/
packs/cam-primary/ms2/
packs/cam-primary/eoy/
packs/cam-primary/baseline/
packs/cam-primary/eos/
```

A new pack supplies workflow availability/applicability, pure workflow policy/contextual eligibility, source authority, and source-backed content. Generic engine files should stay unchanged unless tests prove the new workflow needs a capability that is genuinely reusable across workflows.

## 10. Testing boundaries

- `core/`: pure deterministic unit tests, including a fake second workflow proving no MS1 coupling.
- `platform/`: semantic DOM fixture tests and fail-closed selector/state tests; no MS1 academic classification in the adapter.
- `packs/ms1/`: pack-availability vs contextual-eligibility separation, workflow-policy classification, scale/look-alike rules, source completeness/provenance/content-rule tests.
- `ui/`: owned DOM, accessibility, finite motion, focus, duplication tests.
- `runtime/`: one-root, one-lifecycle-owner, route invalidation, at-most-one verified-grid delegated boundary, no document-wide native listener, cleanup, listener-count and no-native-action tests.
- builder: deterministic output, host isolation, production-file protection, checksum tests.
- static safety: forbidden polling/network/storage/native-action/MutationObserver/document-wide-native-listener primitives.

Focused RED→GREEN testing happens inside a build group. Full protected regression runs at shared/platform boundaries and always at the final hardening gate.

## 11. Non-goals

This design does not authorize:

- merge to `main`;
- Store publication;
- production manifest integration;
- auto grade / Fill / Save / Publish / Send;
- synthetic native click/typing;
- background analytics/backend;
- adding future workflow packs before MS1 Lab validation;
- refactoring unrelated PowerHub code.

## 12. Design acceptance criteria

The architecture is accepted only if all of the following remain true:

1. one generic engine can host MS1 and a fake second workflow without MS1 strings in core/UI/runtime;
2. pack availability/workflow selection is explicitly separate from strict contextual academic eligibility;
3. the generic PowerTeacher adapter exposes sanitized semantic facts without MS1 academic classification;
4. the MS1 pack owns pure workflow policy, official-category/look-alike/scale rules, contextual eligibility, source authority, and content without owning DOM/listeners/timers/native actions;
5. MS1 Lab can be built without modifying or importing the protected Phase 0 Teacher Support runtime as a hidden dependency;
6. a later production integration is required to converge to one registry and one lifecycle rather than running Phase 0 and Generic Engine implementations in parallel;
7. idle Teacher Support performs no recurring work;
8. one runtime owns route/class subscriptions, the at-most-one verified-grid delegated native boundary, cleanup, and invalidation;
9. no document-wide native click listener or MutationObserver is introduced by the current Lab contract;
10. 40 MS1 criteria are complete in data but not pre-rendered as 40 persistent DOM cards;
11. inherited Final Spec academic, G0 DOM, teacher-control, privacy, accessibility, motion, testing, and live-validation requirements remain normative;
12. R4 remains an external golden reference, not a merged dependency;
13. future pack addition does not require copy-pasting the engine.
