# Teacher Support Generic Engine + Isolated MS1 Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Build one generic, fail-closed Teacher Support engine with CAM Primary MS1 as the first workflow pack, validate it in a deterministic standalone PowerTeacher Lab, and leave the protected production runtime unchanged.

**Architecture:** Canonical new code lives under \`extension/modules/teacher-support/\`. A generic PowerTeacher adapter emits sanitized platform semantics; the selected workflow pack owns workflow-specific policy and academic eligibility; generic core resolves state and builds view models; one runtime owns page lifecycle integration; UI owns only extension DOM. The Lab packages the generic engine + MS1 pack without importing the protected Phase 0 Teacher Support runtime.

**Tech Stack:** Chrome Manifest V3; plain JavaScript with browser globals plus CommonJS exports for Node tests; Node built-in \`node:test\` / \`assert\`; no runtime npm dependencies; CSS-only finite motion; local packaged PNG asset.

**Spec:** \`docs/superpowers/specs/2026-10-05-teacher-support-generic-engine-isolated-lab-design.md @ f760f0d0ee14d54c9ece5ac4e26fd08737a79b9b\`

**Inherited Spec:** \`docs/superpowers/specs/2026-10-04-ms1-isolated-lab-design.md @ a56ceafa3d022042c87b178243f51e058efcc8a0\`

**Supersedes Plan:** \`docs/superpowers/plans/2026-10-04-ms1-isolated-lab.md\` (historical only; do not execute it)

## Global Constraints

- Implement only on \`feature/ms1-isolated-lab\`; protected base is \`main @ bcd9cb7996247c1f32706c9b41449ac947e7bb15\`.
- Before implementation, use \`superpowers:using-git-worktrees\` if working locally; do not implement in an unisolated working tree.
- During the Lab phase, do not modify \`extension/manifest.json\`, pre-existing \`extension/src/**\`, or pre-existing \`extension/assets/**\`.
- Canonical new source lives only under \`extension/modules/teacher-support/**\`; generated \`dist/ms1-lab/**\` is never canonical.
- The Lab must not import or execute the protected Phase 0 Teacher Support registry/lifecycle as a hidden dependency.
- Production integration, migration of Phase 0 entrypoints, merge to \`main\`, Store publication, and production version bumps are out of scope.
- R4 remains a frozen UX/behavior reference only; do not import reconstructed \`sis/\` runtime or create an R4 Git dependency.
- Generic \`core/\`, \`runtime/\`, and \`ui/\` must contain no MS1 academic strings or MS1-specific eligibility rules.
- The generic PowerTeacher adapter may expose verified platform semantics but must not classify official MS1 categories or decide MS1 academic eligibility.
- Workflow-pack availability/selection and strict contextual academic eligibility are separate gates.
- The MS1 pack owns pure workflow policy, official-category classification, live-approved aliases, look-alike rejection, exact scale compatibility, contextual eligibility, source authority, and source-backed content.
- Generic \`MS1\` text or a persisted \`MS1\` filter value is never sufficient contextual academic eligibility evidence.
- MS1 contextual eligibility requires verified PowerTeacher + verified Standards + current official rubric strand + selected native cell mapped to that strand + exact \`EE / AE / ME / BE / WB\` scale + fresh context after the latest class/route invalidation.
- Do not require simultaneous 8/8 rubric categories in the DOM; current-strand logic is pagination-aware.
- Only live-approved aliases \`MS1-Academic\`, \`MS1-Attitude\`, \`MS1-Behaviour\`, and \`MS1-Equipment\` may be treated as aliases; the other official categories require exact normalized official-title evidence until later approved evidence exists.
- \`MS1-TA-Grade\`, \`MS1-TA-Score\`, VN Ranking, Unit/LSPC and ambiguous/unknown MS1 columns fail closed.
- No fixed absolute \`cellIndex\` may identify a strand.
- Route/hash events invalidate old academic context even when the normalized route path is unchanged; persisted filter text does not carry eligibility forward.
- Runtime owns all page-lifecycle listeners; packs, adapter, resolver and controller own no persistent page listeners.
- Runtime may bind at most one delegated native interaction boundary to the currently verified Standards grid; no document-wide native click listener is allowed.
- No \`MutationObserver\` is authorized for this Lab; no polling, \`setInterval\`, recurring \`requestAnimationFrame\`, periodic render, recurring storage activity, or network activity is allowed.
- No native \`.click()\`, \`dispatchEvent()\`, synthetic typing, grade selection/write, Fill, Save, Publish, Send, comment/flag mutation, Undo or Recalculate.
- Runtime state is ephemeral; do not persist or transmit student/teacher identity, raw section/person/user IDs, emails, auth/cookies/tokens, grades, comments, SIS payloads, or teacher academic judgement.
- Official authority is \`cam-primary-ms1-official\`; interpretive support is \`cam-primary-ms1-interpretive\`. Official wording wins on conflict.
- Official content is exactly 8 categories × 5 levels = 40 criterion cells, each with provenance.
- English is default academic support; VI is explicit, secondary, MS1-only assistance and never follows Hub/browser locale automatically.
- Unsupported Vietnamese academic content must not be invented.
- Subject examples are optional and source-backed only for English / Maths / Science; unknown subject gets no borrowed example.
- Hub reference controls never recommend or write a final level; preserve the teacher-final-decision message.
- Exactly one extension-owned Teacher Support root exists at runtime.
- Motion is finite CSS-only and \`prefers-reduced-motion\` safe; image failure must leave guidance usable.
- No external backend, analytics endpoint, CDN, GIF/video, animation library, or runtime dependency is introduced.

## Review Focus

1. **Same-path class switch with persisted \`MS1\` filter:** stale strand/cell/inspector must become ineligible immediately, old grid listener must detach, and a fresh semantic read must be required before contextual guidance returns. Pinned in G4.
2. **Paginated rubric mixed with TA/Ranking/Unit/LSPC look-alikes:** one verified current rubric strand may become eligible without 8/8 presence; look-alikes and ambiguous headers must remain ineligible. Pinned in G2.
3. **Absolute table structure changes:** selected native cell must map by current relative standard-column position, never a hard-coded absolute cell index. Pinned in G1.
4. **Workflow is available before academic context is eligible:** Guide me / Quick Reference must work before a native rubric cell is verified, while Score Inspector remains fail-closed. Pinned in G1 + G2 + G4.
5. **Lifecycle duplication under repeated open/collapse/route/grid cycles:** one root, one route-listener set, at most one grid boundary, finite UI listeners, and zero recurring idle work. Pinned in G3 + G4 + G5.

---

# G1 — Generic Foundation + Semantic Decision Engine

## Task G1.1: Lock the Lab boundary, test harness, and generic workflow registry

**Files:**
- Create: \`extension/modules/teacher-support/core/workflow-registry.js\`
- Create: \`tests/teacher-support/core/workflow-registry.test.js\`
- Create: \`tests/teacher-support/fixtures/powerteacher-g0.json\`
- Create: \`tests/teacher-support/protected-boundary.test.js\`
- Create: \`scripts/run-teacher-support-tests.mjs\`
- Modify: \`package.json\` (dev-only script addition)

**Interfaces:**
- \`createWorkflowRegistry() -> { register(pack), get(id), list(), select(context) }\`
- Registered pack minimum contract at this stage: \`{ id, workflow, availability(context) }\`.
- \`select(context) -> { status: "none" | "matched" | "ambiguous", pack, matchIds }\`.
- Selection answers pack availability only; it does not answer academic eligibility.

- [ ] **Step 1: Write failing registry tests**

Tests must pin:
- duplicate pack IDs are rejected;
- zero matches -> \`none\`;
- one availability match -> \`matched\`;
- two availability matches -> \`ambiguous\` with no selected pack;
- a fake second workflow can register/select without editing registry code;
- registry source contains no MS1-specific academic values.

Run: \`node --test tests/teacher-support/core/workflow-registry.test.js\`  
Expected: FAIL because the generic registry does not exist.

- [ ] **Step 2: Implement the minimal registry**

Implement \`createWorkflowRegistry()\` in \`workflow-registry.js\` with immutable snapshots/results and no DOM, timer, storage, network, listener, or pack-specific logic.

- [ ] **Step 3: Run registry tests**

Run: \`node --test tests/teacher-support/core/workflow-registry.test.js\`  
Expected: PASS.

- [ ] **Step 4: Add the sanitized G0 fixture and protected-boundary test**

\`powerteacher-g0.json\` records only semantic evidence required by deterministic tests:
- exact PowerTeacher host/path family;
- Grading/Standards/filter semantics;
- partial/paginated headers;
- live-approved aliases;
- look-alike examples;
- relative selected-cell standard position;
- exact native scale values;
- same-path class-switch behavior with persisted filter.

It must contain no raw section/student/teacher/person/user/email/token/cookie/score/grade identifiers.

\`protected-boundary.test.js\` must fail if any pre-existing file under \`extension/manifest.json\`, \`extension/src/**\`, or \`extension/assets/**\` differs from protected base \`bcd9cb7996247c1f32706c9b41449ac947e7bb15\`.

Run: \`node --test tests/teacher-support/protected-boundary.test.js\`  
Expected: PASS after fixture/test creation.

- [ ] **Step 5: Add deterministic Teacher Support test runner**

Create \`scripts/run-teacher-support-tests.mjs\` to discover \`tests/teacher-support/**/*.test.js\`, sort paths, and invoke Node's test runner without third-party dependencies. Add:
- \`"test:teacher-support": "node scripts/run-teacher-support-tests.mjs"\`

Preserve existing \`test\` and \`verify:phase0\` scripts unchanged.

Run: \`npm run test:teacher-support\`  
Expected: current Teacher Support tests PASS.

- [ ] **Step 6: Run protected Phase 0 regression**

Run: \`npm test\`  
Expected: existing Phase 0 tests PASS unchanged.

- [ ] **Step 7: Commit G1.1**

\`\`\`bash
git add package.json scripts/run-teacher-support-tests.mjs extension/modules/teacher-support/core/workflow-registry.js tests/teacher-support
git commit -m "test: establish generic teacher support boundary"
\`\`\`

## Task G1.2: Add platform-semantic adapter, generic state resolver, and controller

**Files:**
- Create: \`extension/modules/teacher-support/platform/powerteacher/ui-contract.js\`
- Create: \`extension/modules/teacher-support/platform/powerteacher/ui-adapter.js\`
- Create: \`extension/modules/teacher-support/core/state-resolver.js\`
- Create: \`extension/modules/teacher-support/core/support-controller.js\`
- Create: \`tests/teacher-support/platform/ui-adapter.test.js\`
- Create: \`tests/teacher-support/core/state-resolver.test.js\`
- Create: \`tests/teacher-support/core/support-controller.test.js\`

**Interfaces:**
- \`createPowerTeacherUiAdapter({ document, location, getComputedStyle })\`
  - \`readTeacherUiState() -> TeacherUiState\`
  - \`getNativeTarget(targetKey) -> Element | null\`
  - \`getVerifiedStandardsGrid() -> Element | null\`
  - \`classifyNativeInteraction(target) -> { kind: "standard-cell" | "other" }\`
- \`TeacherUiState\` contains sanitized platform facts only:
  - \`platformVerified\`, \`routePath\`, \`courseLabel\`;
  - Grading available/active;
  - Standards verified/grid count/gear visibility;
  - filter visible/value/toggle label;
  - rendered standard headers with relative \`standardPosition\`, raw semantic \`text\` and \`title\`;
  - selected native cell with relative \`standardPosition\`;
  - native scale codes and inspector-open fact.
- \`resolveSupportState({ selection, workflowDecision, uiState, context, mode }) -> SupportState\`.
- Generic support states: \`DORMANT\`, \`AMBIGUOUS\`, \`QUIET\`, \`REFERENCE\`, \`GUIDANCE\`, \`CONTEXT_UNVERIFIED\`, \`CONTEXT_READY\`, \`STOPPED\`.
- \`createSupportController({ registry, resolver }) -> { evaluate({ context, uiState, mode }) }\`.
- Controller calls only the selected pack's pure \`decideWorkflow({ uiState, context, mode })\`; it does not know MS1 rules.

- [ ] **Step 1: Write failing PowerTeacher semantic adapter tests**

Pin:
- wrong origin/path -> \`platformVerified:false\`;
- Standards requires composite verified UI state, not route text alone;
- hidden/visible filter semantics use computed visibility + visible toggle label;
- duplicate Standards grid -> fail-closed semantic state;
- rendered headers preserve relative standard positions but receive no MS1 classification;
- selected cell maps to a relative standard-column position even when leading non-standard columns shift absolute \`cellIndex\`;
- native scale is reported as observed codes only;
- adapter source contains no official MS1 category map, live MS1 aliases, look-alike list, or eligibility decision.

Run: \`node --test tests/teacher-support/platform/ui-adapter.test.js\`  
Expected: FAIL.

- [ ] **Step 2: Implement \`ui-contract.js\` and \`ui-adapter.js\`**

Lock exact PowerTeacher selectors/semantic target keys from the inherited Final Spec, but keep the adapter academically neutral. DOM reads are scoped to the verified contract and performed only on explicit \`readTeacherUiState()\` calls.

- [ ] **Step 3: Run platform tests**

Run: \`node --test tests/teacher-support/platform/ui-adapter.test.js\`  
Expected: PASS.

- [ ] **Step 4: Write failing generic resolver/controller tests**

Use fake packs, including a fake non-MS1 second workflow. Pin:
- no match -> \`DORMANT\`;
- ambiguous -> \`AMBIGUOUS\`;
- mode quiet -> \`QUIET\`;
- reference decision -> \`REFERENCE\`;
- generic guidance decision -> \`GUIDANCE\`;
- context-unverified decision -> \`CONTEXT_UNVERIFIED\`;
- context-ready decision -> \`CONTEXT_READY\`;
- controller never treats selection as academic eligibility by itself;
- core source contains no \`MS1\`, official category names, native MS1 level-code array, or PowerTeacher selectors.

Run: \`node --test tests/teacher-support/core/state-resolver.test.js tests/teacher-support/core/support-controller.test.js\`  
Expected: FAIL.

- [ ] **Step 5: Implement resolver and controller**

The controller flow is fixed:

\`\`\`text
registry.select(context)
  -> selected pack availability
  -> pack.decideWorkflow({ uiState, context, mode })
  -> resolveSupportState(...)
  -> generic state + pack-produced view data
\`\`\`

No page listener or DOM ownership belongs in controller/resolver.

- [ ] **Step 6: Run the G1 integration gate**

Run:
- \`node --test tests/teacher-support/core/workflow-registry.test.js tests/teacher-support/core/state-resolver.test.js tests/teacher-support/core/support-controller.test.js tests/teacher-support/platform/ui-adapter.test.js\`
- \`npm test\`

Expected: all PASS; protected Phase 0 remains unchanged.

- [ ] **Step 7: Commit G1.2**

\`\`\`bash
git add extension/modules/teacher-support/core extension/modules/teacher-support/platform tests/teacher-support/core tests/teacher-support/platform
git commit -m "feat: add generic teacher support decision engine"
\`\`\`

**G1 Gate:** Do not start G2 unless the fake second workflow proves core/adapter contain no MS1 academic coupling and protected production files remain unchanged.

---

# G2 — Complete CAM Primary MS1 Pack

## Task G2.1: Implement the complete source-backed MS1 pack and strict academic gate

**Files:**
- Create: \`extension/modules/teacher-support/packs/cam-primary/ms1/index.js\`
- Create: \`extension/modules/teacher-support/packs/cam-primary/ms1/applicability.js\`
- Create: \`extension/modules/teacher-support/packs/cam-primary/ms1/sources.js\`
- Create: \`extension/modules/teacher-support/packs/cam-primary/ms1/content/official.js\`
- Create: \`extension/modules/teacher-support/packs/cam-primary/ms1/content/guidance.js\`
- Create: \`extension/modules/teacher-support/packs/cam-primary/ms1/content/locale.js\`
- Create: \`extension/modules/teacher-support/packs/cam-primary/ms1/content/examples.js\`
- Create: \`tests/teacher-support/packs/cam-primary/ms1/pack-contract.test.js\`
- Create: \`tests/teacher-support/packs/cam-primary/ms1/official-content.test.js\`
- Create: \`tests/teacher-support/packs/cam-primary/ms1/guidance-content.test.js\`

**Interfaces:**
- \`createCamPrimaryMs1Pack() -> Ms1Pack\`.
- \`Ms1Pack.id === "cam-primary.ms1"\`; \`workflow === "ms1"\`.
- \`availability(context) -> { matched, reason }\` is coarse workflow availability only.
- Lab selection uses explicit trusted Lab context \`requestedPackId:"cam-primary.ms1"\`; DOM filter text never selects the pack.
- \`classifyStandardHeader({ text, title }) -> { kind:"rubric"|"lookalike"|"unknown", areaId, officialTitle, reason }\`.
- \`isCompatibleScale(codes) -> boolean\`.
- \`evaluateContextualEligibility({ uiState, context }) -> { eligible, areaId, officialTitle, reason }\`.
- \`decideWorkflow({ uiState, context, mode }) -> WorkflowDecision\`.
- \`getReference({ areaId, levelCode, language, subject }) -> ReferenceViewData\`.

- [ ] **Step 1: Write failing pack-policy tests**

Pin:
- explicit Lab configuration can make the MS1 pack available before a native rubric cell exists;
- generic filter text \`MS1\` alone never creates contextual eligibility;
- live aliases Academic/Attitude/Behaviour/Equipment classify only as approved;
- no guessed aliases exist for Classwork/Communication/Collaboratively/Creativity;
- exact normalized official titles identify all eight official areas;
- TA Grade / TA Score / VN Ranking / Unit / LSPC -> look-alike/ineligible;
- generic or ambiguous MS1 header -> unknown/ineligible;
- exact ordered scale \`EE, AE, ME, BE, WB\` passes; missing/extra/reordered values fail;
- current header + selected relative cell position + exact scale + fresh context -> eligible;
- stale context, duplicate grid, unknown strand, mismatched selected position, missing inspector/scale evidence -> ineligible;
- partial current strand set does not require 8/8 DOM presence.

Run: \`node --test tests/teacher-support/packs/cam-primary/ms1/pack-contract.test.js\`  
Expected: FAIL.

- [ ] **Step 2: Implement pure MS1 policy in \`applicability.js\` and pack contract in \`index.js\`**

Workflow decisions must cover inherited behavior without native action:
- need Grading;
- need Standards;
- need filter visibility;
- need manual \`MS1\` query;
- current context unverified/open a rubric cell;
- contextual ready;
- Quick Reference;
- quiet.

Represent these as pack-owned step IDs/view data; generic core must not hard-code them.

- [ ] **Step 3: Run pack-policy tests**

Run: \`node --test tests/teacher-support/packs/cam-primary/ms1/pack-contract.test.js\`  
Expected: PASS.

- [ ] **Step 4: Write failing official-content provenance tests**

Populate assertions for:
- exactly 8 official categories;
- exactly 5 level codes in official order;
- exactly 40 official criterion cells;
- every official cell carries \`cam-primary-ms1-official\` provenance;
- official category wording, including \`Completion of classwork/Homework (Secondary)\`, matches the authoritative source exactly;
- no thresholds, percentages, scoring formula, recommendation language, or invented criterion appears.

Run: \`node --test tests/teacher-support/packs/cam-primary/ms1/official-content.test.js\`  
Expected: FAIL until official data is populated from the approved source.

- [ ] **Step 5: Populate \`sources.js\` and \`content/official.js\` from the approved authoritative source**

Do not paraphrase official criteria. Do not use derived bilingual material to overwrite official wording.

- [ ] **Step 6: Write failing guidance/locale/example tests**

Pin:
- derived explanations/evidence/checklists/comparisons trace to an official area/level and interpretive source;
- EN is default;
- VI requires explicit MS1 assist selection and never reads Hub/browser locale;
- unsupported VI content falls back to source-backed English rather than invented translation;
- subject examples exist only when source-backed for English/Maths/Science;
- unknown subject returns no borrowed example;
- adjacent comparison is local and never recommends a level;
- final teacher-decision message is retained.

- [ ] **Step 7: Populate \`guidance.js\`, \`locale.js\`, and \`examples.js\` only from approved sources**

Keep derived content data-oriented; no DOM, listeners, timers, storage, network, or native actions.

- [ ] **Step 8: Run the G2 gate**

Run:
- \`node --test tests/teacher-support/packs/cam-primary/ms1/*.test.js\`
- \`npm run test:teacher-support\`
- \`npm test\`

Expected: 40/40 official cells + complete source-backed pack PASS; no protected production drift.

- [ ] **Step 9: Commit G2**

\`\`\`bash
git add extension/modules/teacher-support/packs tests/teacher-support/packs
git commit -m "feat: add complete CAM Primary MS1 support pack"
\`\`\`

**G2 Gate:** Do not start G3 while any official criterion/provenance, look-alike, exact-scale, stale-context, VI, subject-example, or teacher-decision test is red.

---

# G3 — Generic Guidance UX + Contextual Inspector

## Task G3.1: Build the generic entry control and assistant panel shell

**Files:**
- Create: \`extension/modules/teacher-support/ui/entry-button.js\`
- Create: \`extension/modules/teacher-support/ui/assistant-panel.js\`
- Create: \`extension/modules/teacher-support/ui/teacher-support.css\`
- Create: \`tests/teacher-support/helpers/fake-dom.js\`
- Create: \`tests/teacher-support/ui/entry-panel.test.js\`

**Interfaces:**
- Runtime owns \`#hub-assistant-teacher-support-root\`.
- \`createEntryButton({ document, root, onIntent }) -> { render(model), focus(), destroy() }\`.
- \`createAssistantPanel({ document, root, assetUrl, onIntent }) -> { render(model), focusInitial(), close(), destroy() }\`.
- UI emits semantic intents only, e.g. \`open\`, \`guide\`, \`resume\`, \`quiet\`, \`reference\`, \`show-target\`, \`close\`.
- CSS prefix: \`ha-ts-\`.

- [ ] **Step 1: Write failing entry/panel accessibility and motion tests**

Pin:
- entry is a semantic keyboard-focusable button;
- exactly one entry node is rendered inside the provided Teacher Support root;
- first eligible mount can apply one finite spring state only;
- interaction/open removes attention state and it does not restart on ordinary rerender;
- reduced-motion model disables movement;
- panel actions are semantic buttons with visible focus classes;
- Escape while focus is inside panel closes it and returns focus to entry;
- image failure does not remove text/actions;
- panel copy/view model contains no MS1-specific logic in generic UI source.

Run: \`node --test tests/teacher-support/ui/entry-panel.test.js\`  
Expected: FAIL.

- [ ] **Step 2: Implement entry button, panel shell, and finite CSS motion**

CSS constraints:
- finite entry spring only;
- finite Error Bot bounce only, max 2–3 cycles;
- no \`infinite\`;
- \`prefers-reduced-motion\` disables transform motion;
- viewport-safe panel width;
- visible keyboard focus;
- no native PowerTeacher CSS mutation.

- [ ] **Step 3: Run G3.1 tests**

Run: \`node --test tests/teacher-support/ui/entry-panel.test.js\`  
Expected: PASS.

- [ ] **Step 4: Commit G3.1**

\`\`\`bash
git add extension/modules/teacher-support/ui tests/teacher-support/ui/entry-panel.test.js tests/teacher-support/helpers/fake-dom.js
git commit -m "feat: add generic teacher support panel shell"
\`\`\`

## Task G3.2: Add contextual Score Inspector, Quick Reference, and owned target hint

**Files:**
- Create: \`extension/modules/teacher-support/ui/score-inspector.js\`
- Modify: \`extension/modules/teacher-support/ui/assistant-panel.js\`
- Modify: \`extension/modules/teacher-support/ui/teacher-support.css\`
- Create: \`tests/teacher-support/ui/score-inspector.test.js\`

**Interfaces:**
- \`createScoreInspector({ document, root, onIntent }) -> { render(viewModel), reset(), destroy() }\`.
- Contextual inspector consumes only controller view data; it never reads PowerTeacher DOM.
- Hub reference intents: \`reference-level\`, \`assist-language\`.
- Target hint consumes an already-measured rectangle supplied by runtime and renders extension-owned overlay only.

- [ ] **Step 1: Write failing contextual inspector tests**

Pin:
- verified current official title appears in contextual mode;
- five Hub reference controls appear in order \`EE AE ME BE WB\`;
- no Hub level is selected by default;
- selecting a reference level emits only a Hub intent;
- content ladder order is Official criterion -> explanation -> classroom evidence -> observation prompts -> optional subject example -> adjacent comparison -> teacher-final-decision message;
- forbidden recommendation/confidence/formula copy never renders;
- no contextual area picker appears when a native strand is verified.

- [ ] **Step 2: Add failing EN/VI + Quick Reference tests**

Pin:
- EN opens by default;
- VI changes only MS1 support view state after explicit teacher action;
- global/browser locale is not read;
- unknown subject has no subject example;
- Quick Reference works without contextual eligibility, is visibly reference-only, and cannot set native/contextual strand state;
- target hint renders only from supplied rectangle and never scrolls/clicks native DOM.

Run: \`node --test tests/teacher-support/ui/score-inspector.test.js\`  
Expected: FAIL.

- [ ] **Step 3: Implement inspector/reference/hint rendering**

Keep content generic: UI renders fields supplied by pack/controller. No MS1 academic constants belong in generic UI source.

- [ ] **Step 4: Run the G3 gate**

Run:
- \`node --test tests/teacher-support/ui/*.test.js\`
- \`npm run test:teacher-support\`

Expected: PASS with one owned root contract, accessible finite motion, and no native mutation.

- [ ] **Step 5: Commit G3.2**

\`\`\`bash
git add extension/modules/teacher-support/ui tests/teacher-support/ui
git commit -m "feat: add generic contextual support inspector"
\`\`\`

**G3 Gate:** UI must remain controller/view-model driven; if generic UI needs to inspect PowerTeacher or understand an MS1 academic rule, move that responsibility back to the owning platform/pack boundary before continuing.

---

# G4 — Single Runtime + End-to-End PowerTeacher Orchestration

## Task G4.1: Implement the sole lifecycle owner and full teacher-led MS1 orchestration

**Files:**
- Create: \`extension/modules/teacher-support/runtime/support-runtime.js\`
- Create: \`tests/teacher-support/runtime/support-runtime.test.js\`

**Interfaces:**
- \`createSupportRuntime({ window, document, adapter, controller, ui, contextProvider, assetUrl })\`.
- Runtime methods: \`start()\`, \`reconcile(trigger)\`, \`invalidate(reason)\`, \`destroy()\`, \`snapshot()\`.
- Snapshot includes:
  - \`started\`, generic \`state\`, \`panelOpen\`, \`quiet\`, \`referenceMode\`;
  - \`contextFresh\`, \`contextEpoch\`;
  - \`selectedReferenceLevel\`, \`assistLanguage\`;
  - route listener flags and whether a verified-grid delegated boundary is attached.
- \`contextProvider()\` supplies trusted Lab config \`requestedPackId:"cam-primary.ms1"\` plus ephemeral non-sensitive context only.

- [ ] **Step 1: Write failing start/destroy/idempotency tests**

Pin:
- wrong host/path -> no root/UI/listeners;
- valid Lab host -> exactly one \`#hub-assistant-teacher-support-root\` direct child of body;
- repeated start/open/collapse/reconcile does not duplicate root or route listeners;
- destroy removes root, route listeners, grid boundary, overlays and ephemeral state;
- idle runtime creates no polling/timer/observer/network/storage work.

- [ ] **Step 2: Write failing teacher-led walkthrough tests**

With MS1 pack loaded:
- Guide me from pre-Grading state renders the pack-produced Grading step;
- Standards/filter/query steps advance only after fresh semantic reads;
- teacher must manually choose Show Filter and type \`MS1\`;
- \`show-target\` measures the adapter-provided native target once and renders only extension overlay;
- Quick Reference is available before strict contextual eligibility;
- generic filter \`MS1\` with no verified rubric cell stays context-unverified;
- verified contextual eligibility opens Score Inspector;
- Hub level/VI actions update only ephemeral Hub view state.

- [ ] **Step 3: Write failing scoped native interaction tests**

Pin:
- runtime binds at most one delegated click listener to the currently verified Standards grid;
- only a teacher click classified by adapter as \`standard-cell\` schedules one \`queueMicrotask\` semantic reconcile;
- non-standard grid clicks do nothing;
- runtime never calls target \`.click()\`, \`dispatchEvent()\`, or synthetic input;
- replacing/invalidating the grid detaches old boundary before a new one can attach;
- there is no document-wide native click listener.

- [ ] **Step 4: Write failing same-path route/class invalidation tests**

Fixture transition uses the approved G0 shape:
- old contextual strand/cell eligible;
- route event fires;
- normalized route remains \`/classes/final_grades\`;
- course label changes;
- native \`MS1\` filter persists;
- old selected cell/inspector disappears.

Assert:
- invalidation immediately sets \`contextFresh:false\`;
- old contextual inspector is neutralized/closed;
- selected Hub reference level resets to null and assist language resets to EN for the new academic context;
- old grid boundary detaches;
- persisted filter alone remains ineligible;
- a later fresh semantic read may reattach one boundary only after the new Standards grid verifies;
- duplicate hash/pop route signals remain idempotent and do not duplicate reset/listeners.

- [ ] **Step 5: Implement \`support-runtime.js\`**

Use only:
- \`hashchange\` and \`popstate\` as bounded route invalidation signals;
- teacher UI intents;
- one currently verified Standards-grid delegated boundary;
- \`queueMicrotask\` for post-native semantic reread when needed.

No MutationObserver, polling, recurring timer, document-wide click listener, native action synthesis, or persistent storage.

- [ ] **Step 6: Run G4 integration/performance gate**

Run:
- \`node --test tests/teacher-support/runtime/support-runtime.test.js\`
- \`npm run test:teacher-support\`
- \`npm test\`

Expected: all PASS; runtime is sole page-lifecycle owner; protected production remains unchanged.

- [ ] **Step 7: Commit G4**

\`\`\`bash
git add extension/modules/teacher-support/runtime tests/teacher-support/runtime
git commit -m "feat: add single teacher support runtime"
\`\`\`

**G4 Gate:** Do not start packaging while any stale-context, duplicate-listener, native-action, same-path class-switch, or idle-recurring-work test is red.

---

# G5 — Deterministic Isolated Build + Performance/Safety Hardening + Live Gate

## Task G5.1: Build the deterministic standalone Lab and static safety gates

**Files:**
- Create: \`tools/build-ms1-lab.mjs\`
- Create: \`scripts/verify-teacher-support.mjs\`
- Create: \`tests/teacher-support/build/build-ms1-lab.test.js\`
- Create: \`tests/teacher-support/security/static-safety.test.js\`
- Modify: \`package.json\`
- Generate only: \`dist/ms1-lab/**\`

**Interfaces:**
- \`build-ms1-lab.mjs\` takes no network input and writes only \`dist/ms1-lab/\`.
- Lab version: \`0.1.0\`.
- Lab manifest matches only \`https://vas.powerschool.com/teachers/*\`.
- Lab has no background, popup/action, storage permission, analytics, or external resource.
- Builder copies canonical \`extension/modules/teacher-support/**\` and local \`extension/assets/robot-assistant.png\`.
- Builder deterministically generates a tiny \`lab-bootstrap.js\` that wires:
  - generic registry;
  - \`cam-primary.ms1\` pack;
  - generic PowerTeacher adapter;
  - generic resolver/controller/UI/runtime;
  - trusted Lab context \`requestedPackId:"cam-primary.ms1"\`;
  - local robot asset URL.
- \`BUILD_INFO.json\` fields: \`protectedBase\`, \`sourceSpec\`, \`sourcePlan\`, \`sourceCommit\`, \`labVersion\`; no wall-clock timestamp.
- \`SHA256SUMS.txt\` contains sorted checksums for every generated file except itself.

- [ ] **Step 1: Write failing deterministic build/isolation tests**

Pin:
- \`dist/ms1-lab/manifest.json\` is generated only under dist;
- exact Lab name/version and host boundary;
- no production PowerHub host/content graph;
- no protected Phase 0 Teacher Support file is copied or loaded;
- no background/popup/storage permission;
- canonical generic engine and one MS1 pack are copied exactly once;
- local robot asset is packaged and web-accessible only to exact PowerTeacher teacher host;
- generated bootstrap starts one canonical runtime and does not import \`extension/src/**\`;
- no Store ZIP or production manifest is touched.

Run: \`node --test tests/teacher-support/build/build-ms1-lab.test.js\`  
Expected: FAIL.

- [ ] **Step 2: Implement deterministic builder**

Fixed generated JS order must respect dependencies and end with generated \`lab-bootstrap.js\`. Never infer order from filesystem enumeration.

- [ ] **Step 3: Write failing static safety/performance tests**

Scan canonical module JS/CSS plus generated Lab for forbidden behavior:
- \`MutationObserver\`;
- \`setInterval\`;
- recurring/unauthorized \`requestAnimationFrame\`;
- \`fetch(\`, \`XMLHttpRequest\`, \`WebSocket\`, \`sendBeacon\`;
- \`localStorage\`, \`sessionStorage\`, \`chrome.storage\`;
- native \`.click(\`, \`dispatchEvent(\`;
- Angular scope/controller/internal-service dependency;
- production PowerHub host in Lab runtime;
- \`infinite\` CSS animation;
- document-wide native click listener;
- duplicate route listener registration sites;
- grade/Fill/Save/Publish/Send/comment/flag/Undo/Recalculate automation.

Also assert generic core/runtime/UI/adapter do not contain the MS1 academic alias/look-alike/category/scale policy constants owned by the pack.

- [ ] **Step 4: Implement/fix until static gates pass**

Do not weaken a safety gate to accommodate unsafe implementation; fix the owning boundary.

- [ ] **Step 5: Add deterministic verifier and package scripts**

Create \`scripts/verify-teacher-support.mjs\` to run, in order:
1. protected Phase 0 verification;
2. sorted Teacher Support tests;
3. JS/MJS syntax checks for new canonical/test/tool files;
4. Lab build;
5. checksum validation;
6. a second Lab build from the same source commit and checksum comparison;
7. protected-production diff guard.

Add:
- \`"build:ms1-lab": "node tools/build-ms1-lab.mjs"\`
- \`"verify:teacher-support": "node scripts/verify-teacher-support.mjs"\`

Preserve existing scripts.

- [ ] **Step 6: Run G5.1 deterministic hardening gate**

Run: \`npm run verify:teacher-support\`  
Expected:
- Phase 0 PASS;
- all Teacher Support tests PASS;
- syntax PASS;
- two builds produce identical \`SHA256SUMS.txt\`;
- protected production diff is empty.

- [ ] **Step 7: Commit G5.1**

\`\`\`bash
git add package.json scripts/run-teacher-support-tests.mjs scripts/verify-teacher-support.mjs tools/build-ms1-lab.mjs tests/teacher-support/build tests/teacher-support/security
git commit -m "build: add deterministic generic MS1 lab"
\`\`\`

Do not commit \`dist/ms1-lab/**\` unless the repository's existing generated-artifact policy is explicitly changed.

## Task G5.2: Whole-branch review, authorized live smoke, and final handoff

**Files:**
- Create: \`docs/teacher-support/GENERIC_ENGINE_MS1_LAB_HANDOFF_2026-10-05.md\`
- Modify runtime/source only if a failed deterministic test first reproduces a live defect in the owning task.

**Interfaces:**
- Consumes all G1–G5.1 commits and generated \`dist/ms1-lab\`.
- Produces a reviewable branch + deterministic verification record + authorized live smoke result + rollback instructions.
- Does not merge or publish.

- [ ] **Step 1: Run whole-branch architecture diff review**

Confirm:
- new runtime source is confined to \`extension/modules/teacher-support/**\`;
- only dev/test/docs/tools/package scripts outside that tree changed;
- \`extension/manifest.json\`, pre-existing \`extension/src/**\`, and pre-existing \`extension/assets/**\` remain byte-protected;
- no duplicate Teacher Support engine is loaded by the Lab;
- no unrelated PowerHub refactor.

- [ ] **Step 2: Run full deterministic verification immediately before live smoke**

Run: \`npm run verify:teacher-support\`  
Expected: PASS.

Record final generated \`dist/ms1-lab/SHA256SUMS.txt\`.

- [ ] **Step 3: Load \`dist/ms1-lab\` unpacked in an authorized test browser/profile and run live smoke**

Manual sequence:
1. exact PowerTeacher teacher host only;
2. one floating Teacher Support entry; no native layout obstruction;
3. finite spring + reduced-motion path;
4. finite Error Bot bounce; image failure fallback remains usable;
5. Guide me: Grading -> Standards;
6. hidden-filter and already-visible-filter branches;
7. teacher manually types \`MS1\`;
8. generic/persisted \`MS1\` filter alone does not open contextual inspector;
9. TA Grade / TA Score / VN Ranking / Unit / LSPC never activate contextual academic guidance;
10. page native Standards columns; one verified current rubric strand may activate without 8/8 DOM presence;
11. teacher manually opens a rubric cell; Score Inspector follows the correct current strand using relative standard-column mapping;
12. Hub \`EE/AE/ME/BE/WB\` controls alter Hub explanation only and never change PowerSchool;
13. VI appears only after explicit teacher action and does not change Hub/global/browser locale;
14. unknown subject gets no borrowed example;
15. class switch while inspector is open invalidates stale guidance even when normalized route stays \`/classes/final_grades\` and filter persists;
16. collapse/wake/re-entry/route cycles create no duplicate root/listeners;
17. no attributable console error or obvious idle CPU spike.

- [ ] **Step 4: Reproduce any live defect deterministically before fixing**

Add the smallest failing test to the task that owns the boundary, make the smallest fix there, rerun \`npm run verify:teacher-support\`, rebuild, then repeat the affected live step. If deterministic reproduction is technically impossible, document the limitation before changing runtime.

- [ ] **Step 5: Write final handoff**

\`GENERIC_ENGINE_MS1_LAB_HANDOFF_2026-10-05.md\` must record:
- branch and final commit SHA;
- protected base SHA;
- Generic Engine spec path/commit;
- inherited Final Spec path/commit;
- canonical implementation plan path/commit;
- Lab version \`0.1.0\`;
- generated checksum location/hash;
- deterministic commands/results;
- live smoke result;
- known limitations;
- Phase 0 convergence status: protected/frozen, not imported by Lab;
- rollback: disable/remove unpacked Lab; production Hub Assistant remains unchanged;
- explicit statement: no merge/publish/production integration is authorized.

- [ ] **Step 6: Commit handoff only if documentation changed**

\`\`\`bash
git add docs/teacher-support/GENERIC_ENGINE_MS1_LAB_HANDOFF_2026-10-05.md
git commit -m "docs: finalize generic MS1 lab handoff"
\`\`\`

**G5 Final Gate:** The branch is ready for a separate future production-integration decision only after deterministic PASS + authorized live PASS. This plan itself never authorizes merge, Store publication, or migration of protected Phase 0 runtime.

---

## Plan Self-Review Result

- **Spec coverage:** Generic architecture, Phase 0 convergence boundary, two-stage availability/eligibility gate, generic adapter, pack-owned MS1 policy, 40-cell source integrity, VI/subject rules, generic UI, contextual inspector, one lifecycle owner, scoped grid boundary, route invalidation, zero recurring idle work, deterministic build, protected-production guard, live smoke and rollback are all mapped to G1–G5.
- **Step scan:** Each task follows RED -> minimal implementation -> focused PASS -> integration gate -> reviewable commit; setup/docs are folded into the task that needs them.
- **Type consistency:** Registry -> controller -> pack decision -> resolver -> runtime/UI interfaces use the same names across groups; adapter remains semantic-only; runtime alone holds native lifecycle element handles.
- **Review Focus coverage:** all five high-risk cases are pinned by named tests in G1/G2/G4/G5.
- **Proportion:** Plan specifies decisions/interfaces/tests without transcribing implementation bodies; pack source text is intentionally not duplicated from authoritative documents.
