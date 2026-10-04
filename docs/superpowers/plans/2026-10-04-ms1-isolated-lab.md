# MS1 Isolated Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Build a standalone, fail-closed MS1 Teacher Support Lab for PowerTeacher that guides teacher-led navigation, recognizes the current paginated MS1 rubric strand and native five-level scale, and presents source-backed contextual support without changing production Hub Assistant behavior or writing to PowerSchool.

**Architecture:** Keep every new runtime source under extension/modules/ms1 as the single canonical implementation. A read-only PowerTeacher adapter converts live DOM into sanitized semantic snapshots; a pure state resolver decides walkthrough and academic eligibility; content modules hold official and derived source-backed guidance; UI modules render one extension-owned floating entry/panel/inspector; and a small runtime owns bounded route/grid listeners and ephemeral state. A deterministic build script copies only this module plus approved local assets into dist/ms1-lab with its own manifest, leaving the production manifest/runtime untouched.

**Tech Stack:** Chrome Manifest V3; plain JavaScript IIFEs on globalThis.PSQM.ms1Lab with CommonJS exports for deterministic Node tests; Node.js built-in node:test/assert; no runtime npm dependencies; CSS-only motion; local packaged PNG assets only.

**Spec:** docs/superpowers/specs/2026-10-04-ms1-isolated-lab-design.md

## Global Constraints

- Implement only on branch feature/ms1-isolated-lab, whose protected base is main @ bcd9cb7996247c1f32706c9b41449ac947e7bb15.
- Before execution, use the Superpowers git-worktree workflow if working locally; do not implement directly in an unisolated working tree.
- Do not modify any pre-existing production file under extension/ outside extension/modules/ms1/. In particular, extension/manifest.json, extension/src/**, extension/assets/**, background, popup, PowerHub load order, and existing PowerTeacher Phase 0 files remain byte-identical to the protected base.
- package.json may receive dev-only MS1 scripts; docs/**, tests/**, tools/**, and generated dist/ms1-lab/** are outside the production runtime boundary.
- Do not merge to main, publish a Store ZIP, overwrite an existing Store package, or bump the production manifest/version in this plan.
- Exact live host boundary: https://vas.powerschool.com/teachers/*.
- Generic MS1 text or a persisted MS1 filter value is never sufficient academic eligibility evidence.
- Academic eligibility is strand-local and pagination-aware: current semantic rubric header + selected native cell mapped to that current standard column + exact native EE/AE/ME/BE/WB scale + fresh context after the latest route/class transition.
- Do not require all eight official categories to be simultaneously rendered in the live DOM.
- Live-verified code aliases from G0 are MS1-Academic, MS1-Attitude, MS1-Behaviour, and MS1-Equipment. Do not pretend the unobserved code aliases for the other four categories are live-verified.
- Recognize unobserved categories only from exact normalized official category titles exposed by the current header/title until later live evidence approves additional aliases.
- Explicit look-alikes must fail closed: MS1-TA-Grade, MS1-TA-Score, MS1-VN-Ranking, MS1-Unit1, MS1-LSPC, and other non-rubric MS1 columns.
- Never use a fixed absolute cellIndex as strand identity. Map the selected td.standard-col to the corresponding currently rendered standard header by relative semantic standard-column position.
- A native class switch may keep routePath=/classes/final_grades. popstate/hashchange invalidate old academic context even when the normalized path string is unchanged.
- The native MS1 filter may persist across class changes and must not carry academic eligibility forward.
- No MutationObserver(document.body), polling, setInterval, recurring animation timer, continuous full-document scan, Angular-controller dependency, internal-service dependency, or network payload dependency.
- No native .click(), dispatchEvent(), synthetic typing, grading, grade selection, Fill, Save, Publish, Send, comment/flag mutation, Undo, or Recalculate.
- Runtime state is ephemeral. Do not persist or transmit student/teacher identity, raw section IDs, person/user IDs, emails, cookies, auth/tokens, scores/grades, comments, SIS payloads, selected academic judgement, or teacher skill level.
- Official academic authority is MS1 Report Teacher Guidance(5).pdf under source ID cam-primary-ms1-official.
- Interpretive support is MS1_All_Levels_Complete_Bilingual(1).pdf under source ID cam-primary-ms1-interpretive; it may clarify but must not override official wording or create cut-offs/formulas.
- Official matrix is exactly 8 categories × 5 levels = 40 criterion cells, each with canonical provenance.
- Preserve the exact official category wording Completion of classwork/Homework (Secondary); do not silently replace it with a Primary reinterpretation.
- English is the default MS1 academic support language. VI is explicit, secondary, MS1-only assistance and is independent from Hub/global/browser locale.
- Do not invent unsupported Vietnamese academic content. When source-backed Vietnamese support is absent, keep the English canonical criterion/support rather than synthesizing a translation.
- Subject examples are optional, interpretive, and limited to source-backed English, Maths, and Science. Unknown subject shows no borrowed subject example.
- Hub reference level controls EE/AE/ME/BE/WB never write to native PowerSchool. No Hub level is selected by default.
- Always preserve the teacher-decision message: "Use the evidence to compare levels. You make the final judgement."
- Floating entry motion is CSS-only, approximately 450–650 ms, 14–18 px lift, max scale about 1.08, once per tab/runtime; reduced motion disables it.
- Robot bounce is CSS transform only, about 4–6 px, 1.6–2.0 s per cycle, maximum 2–3 cycles, then rest; reduced motion disables it.
- Use exactly one extension-owned root, ID hub-assistant-ms1-root, appended directly under body. Prefix module CSS classes with ha-ms1-.
- Robot/image failure must not block textual guidance.
- No external backend, analytics endpoint, CDN, GIF, video, animation library, or runtime dependency is introduced.

## Review Focus

1. **Class switch on the same normalized route while MS1 filter persists:** old selected strand/inspector must invalidate immediately and stay ineligible until a fresh semantic read; Task 8 pins this.
2. **Paginated partial strands mixed with TA/Ranking/Unit/LSPC look-alikes:** a verified current rubric strand may be eligible without 8/8 DOM presence, while look-alikes remain ineligible; Tasks 2–3 pin this.
3. **Selected cell absolute index changes because leading columns/page layout changes:** mapping must use relative standard-column semantics rather than a fixed cellIndex; Task 2 pins this.
4. **VI/subject support gaps:** explicit VI must not change global locale, unsupported Vietnamese must not be invented, and an unknown subject must not receive another subject's example; Task 5 pins this.
5. **Lifecycle duplication or side-effect creep:** repeated open/collapse/reconcile/route cycles must retain one root/listener set and must not introduce native actions, broad observers, polling, storage, or network calls; Tasks 8–9 pin this.

---

## Exact Planned File Tree

~~~text
package.json                                           # MODIFY, dev-only scripts

docs/
└── ms1/
    └── evidence/
        ├── MS1_DOM_EVIDENCE_SANITIZED.md             # CREATE
        └── MS1_UI_CONTRACT.md                        # CREATE

extension/
└── modules/
    └── ms1/
        ├── README.md                                 # CREATE
        ├── platform/
        │   └── powerteacher/
        │       ├── ui-contract.js                    # CREATE
        │       └── ui-adapter.js                     # CREATE
        ├── state/
        │   └── state-resolver.js                     # CREATE
        ├── content/
        │   ├── sources.js                            # CREATE
        │   ├── areas.js                              # CREATE
        │   ├── levels.js                             # CREATE
        │   ├── official-criteria.js                  # CREATE
        │   ├── plain-explanations.js                 # CREATE
        │   ├── classroom-evidence.js                 # CREATE
        │   ├── observation-checklists.js             # CREATE
        │   ├── comparisons.js                        # CREATE
        │   ├── assist-copy.en.js                     # CREATE
        │   ├── assist-copy.vi.js                     # CREATE
        │   └── subject-examples/
        │       ├── english.js                        # CREATE
        │       ├── maths.js                          # CREATE
        │       └── science.js                        # CREATE
        ├── ui/
        │   ├── entry-button.js                       # CREATE
        │   ├── assistant-panel.js                    # CREATE
        │   ├── score-inspector.js                    # CREATE
        │   └── ms1.css                               # CREATE
        ├── runtime/
        │   └── ms1-runtime.js                        # CREATE
        └── bootstrap/
            └── content.js                            # CREATE

tools/
└── build-ms1-lab.mjs                                 # CREATE

tests/
└── ms1/
    ├── fixtures/
    │   └── ms1-dom-contract.json                     # CREATE
    ├── helpers/
    │   └── fake-dom.js                               # CREATE only when Task 6 needs it
    ├── protected-baseline.test.js                    # CREATE
    ├── ui-contract.test.js                           # CREATE
    ├── state-resolver.test.js                        # CREATE
    ├── official-content.test.js                      # CREATE
    ├── derived-content.test.js                       # CREATE
    ├── ui-shell.test.js                              # CREATE
    ├── score-inspector.test.js                       # CREATE
    ├── runtime.test.js                               # CREATE
    ├── build-lab.test.js                             # CREATE
    └── security-performance-static.test.js           # CREATE

dist/
└── ms1-lab/                                          # GENERATED, not canonical source
    ├── manifest.json
    ├── BUILD_INFO.json
    ├── SHA256SUMS.txt
    ├── assets/
    │   └── robot-assistant.png
    └── modules/
        └── ms1/...
~~~

---

### Task 1: Lock G0 Evidence, Module Boundary, and Dev Harness

**Files:**
- Create: docs/ms1/evidence/MS1_DOM_EVIDENCE_SANITIZED.md
- Create: docs/ms1/evidence/MS1_UI_CONTRACT.md
- Create: tests/ms1/fixtures/ms1-dom-contract.json
- Create: tests/ms1/protected-baseline.test.js
- Create: extension/modules/ms1/README.md
- Modify: package.json

**Interfaces:**
- Consumes: Final Spec and G0 D0–D8 evidence already reconciled into the spec.
- Produces: one repository-local sanitized DOM contract fixture; a human-readable UI contract; a protected-production diff gate; dev commands test:ms1, build:ms1-lab, verify:ms1.
- Protected-base constant: bcd9cb7996247c1f32706c9b41449ac947e7bb15.

- [ ] **Step 1: Write the failing MS1 baseline/evidence test**

Test name: ms1 lab has a sanitized G0 contract and no production drift.

Assertions:
- tests/ms1/fixtures/ms1-dom-contract.json exists and parses.
- Fixture records routePath /classes/final_grades, filter persistence across class switch, exact native scale ["EE","AE","ME","BE","WB"], observed rubric aliases Academic/Attitude/Behaviour/Equipment, and explicit look-alike examples.
- Fixture contains no sectionId value, student/teacher/person/user/email/token/cookie data, score, or grade value.
- Run git diff --binary --exit-code against protected base for extension/** excluding the not-yet-created extension/modules/ms1/**; assert no pre-existing production file drift.

Run: node --test tests/ms1/protected-baseline.test.js  
Expected: FAIL because the MS1 fixture/test harness does not exist yet.

- [ ] **Step 2: Create the sanitized evidence artifacts**

MS1_DOM_EVIDENCE_SANITIZED.md must record:
- D0–D3 verified platform/Standards/filter semantics.
- D4 look-alikes: TA Grade, VN Ranking, TA Score, Unit1, LSPC.
- D5 paginated/partial rendering and observed canonical aliases Academic, Attitude, Behaviour, Equipment.
- D6 selected native cell semantics: td.standard-col, keypad-cell/highlight, data-ng-repeat standardColumn, data-pss-score-cell present but no raw ID value stored.
- D7 exact native scale EE/AE/ME/BE/WB.
- D8 class label changed, route path unchanged, popstate/hashchange fired, old selection gone, native inspector closed, MS1 filter persisted.
- Explicit statement that no G0 evidence proves live code aliases for Classwork/Communication/Collaboratively/Creativity.

MS1_UI_CONTRACT.md must lock selectors/semantic rules used by Task 2, not raw identities.

- [ ] **Step 3: Create ms1-dom-contract.json**

Use only sanitized semantic values needed by deterministic tests. Include fixture sections named platform, standards, filter, currentPageHeaders, lookalikes, selectedCell, nativeScale, and classSwitch.

- [ ] **Step 4: Add module README and dev scripts**

README responsibilities:
- canonical module boundary;
- production files are protected;
- source authority;
- build/test commands;
- no native write/no persistence/no network rule;
- standalone Lab is not a Store release.

Preserve existing package.json scripts and add exactly:
- test:ms1 = node --test tests/ms1/*.test.js
- build:ms1-lab = node tools/build-ms1-lab.mjs
- verify:ms1 = node --test tests/phase0/*.test.js tests/ms1/*.test.js

Do not add dependencies or devDependencies.

- [ ] **Step 5: Run the Task 1 gate**

Run: node --test tests/ms1/protected-baseline.test.js  
Expected: PASS.

Run: npm test  
Expected: existing Phase 0 tests PASS unchanged.

- [ ] **Step 6: Commit**

~~~bash
git add package.json docs/ms1/evidence extension/modules/ms1/README.md tests/ms1/fixtures/ms1-dom-contract.json tests/ms1/protected-baseline.test.js
git commit -m "test: lock MS1 G0 evidence and lab boundary"
~~~

---

### Task 2: PowerTeacher Semantic UI Contract and Read-Only Adapter

**Files:**
- Create: extension/modules/ms1/platform/powerteacher/ui-contract.js
- Create: extension/modules/ms1/platform/powerteacher/ui-adapter.js
- Create: tests/ms1/ui-contract.test.js

**Interfaces:**
- Produces ui-contract exports:
  - SELECTORS
  - NATIVE_LEVEL_CODES = Object.freeze(["EE","AE","ME","BE","WB"])
  - normalizeText(value) -> string
  - classifyStandardHeader({ text, title }) -> { kind, areaId, officialTitle, reason }
  - isCompatibleNativeScale(codes) -> boolean
  - mapSelectedCellToRenderedHeader({ standardCells, selectedCell, renderedHeaders }) -> { verified, standardIndex, header }.
- Produces ui-adapter export:
  - createPowerTeacherUiAdapter({ document, window, getComputedStyle }) -> adapter.
- Adapter methods:
  - readSnapshot() -> PowerTeacherMs1Snapshot
  - readCourseLabel() -> string
  - readFilterState() -> FilterState
  - readRenderedHeaders() -> readonly HeaderEvidence[]
  - readSelectedCellContext() -> SelectedCellEvidence
  - readNativeScale() -> NativeScaleEvidence
  - getHighlightTarget(kind) -> Element|null.
- Browser global: PSQM.ms1Lab.powerTeacherUi.

PowerTeacherMs1Snapshot exact semantic shape:

~~~text
{
  platformVerified: boolean,
  routePath: string,
  courseLabel: string,
  grading: { available: boolean, active: boolean },
  standards: { verified: boolean, gridCount: number, gearVisible: boolean },
  filter: { visible: boolean, value: string, toggleLabel: string },
  renderedHeaders: [
    {
      standardIndex: number,
      text: string,
      title: string,
      kind: "rubric" | "lookalike" | "unknown",
      areaId: string | null,
      officialTitle: string | null
    }
  ],
  selectedCell: { found: boolean, standardIndex: number | null },
  selectedStrand: {
    verified: boolean,
    areaId: string | null,
    officialTitle: string | null
  },
  scale: { verified: boolean, codes: readonly string[] },
  nativeInspectorOpen: boolean
}
~~~

- [ ] **Step 1: Write failing header-classification and scale tests**

Required assertions:
- MS1-Academic + title "MS1 - Academic Achievement" -> rubric/academic.
- MS1-Attitude -> rubric/attitude.
- MS1-Behaviour -> rubric/behaviour.
- MS1-Equipment -> rubric/equipment.
- Exact normalized official titles for all eight categories can identify the official area even when no live code alias has been approved.
- Do not add guessed code aliases for Classwork/Communication/Collaboratively/Creativity.
- MS1-TA-Grade, MS1-TA-Score, MS1-VN-Ranking, MS1-Unit1, MS1-LSPC -> lookalike with areaId null.
- generic "MS1" -> unknown.
- ["EE","AE","ME","BE","WB"] -> compatible; wrong order, missing item, extra item -> incompatible.

Run: node --test tests/ms1/ui-contract.test.js  
Expected: FAIL because ui-contract.js does not exist.

- [ ] **Step 2: Implement pure ui-contract.js**

Official title map must contain exactly:
- Academic Achievement
- Attitude Towards Learning
- Behaviour and Personal Development
- Completion of classwork/Homework (Secondary)
- Communication Skills
- Working Collaboratively
- Creativity and Critical thinking
- Equipment and Resources

Normalize whitespace/case for matching, but preserve official display title separately.

- [ ] **Step 3: Add failing relative cell-to-header mapping tests**

Build fixture arrays where:
- leading non-standard columns shift the absolute table cellIndex;
- standardCells order stays aligned to renderedHeaders order;
- selectedCell is the second standard cell in one fixture and the first in another.

Assert mapping returns the matching rendered header by relative standard-column position and never compares a hard-coded absolute cellIndex.

- [ ] **Step 4: Implement mapSelectedCellToRenderedHeader**

Use only current rendered standard cells/headers. Unknown, duplicate, missing, or out-of-range relations return verified:false.

- [ ] **Step 5: Add failing adapter snapshot tests with minimal document fakes**

Cover:
- wrong origin/path -> platformVerified false.
- Standards requires Standards semantics + exactly one computed-visible #standard-final-grades.
- filter visibility comes from computed visibility of #simple-search-standard-final-grades, not #hide-filter presence.
- MS1 filter alone with look-alike headers produces no selectedStrand.
- selected rubric cell + current header + exact native level buttons produces verified selectedStrand/scale.
- ambiguous duplicate Standards grids fail closed.
- adapter never returns raw sectionId/query values or student row text.

- [ ] **Step 6: Implement ui-adapter.js**

Selectors locked from G0:
- #sidebar-charms-grading
- #grading-standards-link
- #section-mega-menu
- #standard-final-grades
- #special-functions
- #hide-filter
- #simple-search-standard-final-grades
- .course-name
- th.standard-column-header.standard-col
- td.standard-col
- body.score-inspector-score as native-inspector corroboration only.

The adapter is read-only. It may call querySelector/querySelectorAll/getComputedStyle/getClientRects but may not mutate native elements.

- [ ] **Step 7: Run contract + baseline regression**

Run: node --test tests/ms1/ui-contract.test.js tests/ms1/protected-baseline.test.js  
Expected: PASS.

- [ ] **Step 8: Commit**

~~~bash
git add extension/modules/ms1/platform/powerteacher tests/ms1/ui-contract.test.js
git commit -m "feat: add read-only MS1 PowerTeacher UI contract"
~~~

---

### Task 3: Pure MS1 State Resolver and Academic Eligibility Gate

**Files:**
- Create: extension/modules/ms1/state/state-resolver.js
- Create: tests/ms1/state-resolver.test.js

**Interfaces:**
- Produces:
  - resolveAcademicEligibility(snapshot, { contextFresh }) -> EligibilityResult
  - resolveWorkflowState(snapshot, uiState) -> WorkflowResult
- EligibilityResult exact shape:
~~~text
{
  eligible: boolean,
  reason: string,
  areaId: string | null,
  officialTitle: string | null
}
~~~
- uiState exact fields:
~~~text
{
  panelOpen: boolean,
  quiet: boolean,
  referenceMode: boolean,
  contextFresh: boolean
}
~~~
- Workflow state values are limited to the Final Spec state model:
  IDLE, ENTRY_VISIBLE, INTRO_OPEN, QUIET, REFERENCE,
  NAV_NEED_GRADING, NAV_NEED_STANDARDS, STANDARDS_READY,
  MS1_NEED_FILTER, MS1_NEED_QUERY, MS1_CONTEXT_UNVERIFIED,
  MS1_CONTEXT_READY, MS1_CELL_CONTEXT, SCORE_INSPECTOR_OPEN,
  ROUTE_INVALIDATED, UNVERIFIED, STOPPED.

- [ ] **Step 1: Write failing eligibility tests**

Positive:
- platform verified + Standards verified + current rubric header + selected cell mapped to it + exact native scale + contextFresh true -> eligible.

Negative, each independent:
- generic MS1 filter only;
- look-alike selected column;
- unknown current header;
- selected cell missing;
- selected cell/header relation ambiguous;
- wrong native scale;
- contextFresh false after class/route invalidation;
- duplicate grid.

Critical pagination assertion:
- only one verified current rubric strand rendered is sufficient; do not require all eight categories.

Run: node --test tests/ms1/state-resolver.test.js  
Expected: FAIL because state-resolver.js does not exist.

- [ ] **Step 2: Implement resolveAcademicEligibility**

Return stable reason strings used by tests/UI, including:
- platform-unverified
- standards-unverified
- strand-unverified
- cell-unverified
- scale-incompatible
- context-stale
- eligible.

- [ ] **Step 3: Add failing walkthrough-state tests**

Required state progression:
- verified host, panel closed -> ENTRY_VISIBLE.
- panel open, Grading inactive -> NAV_NEED_GRADING.
- Grading active, Standards not verified -> NAV_NEED_STANDARDS.
- Standards verified, filter hidden -> MS1_NEED_FILTER.
- filter visible, value not exactly normalized MS1 -> MS1_NEED_QUERY.
- filter MS1, no verified current rubric cell -> MS1_CONTEXT_UNVERIFIED.
- eligible snapshot -> SCORE_INSPECTOR_OPEN.
- referenceMode true -> REFERENCE without pretending current context verified.
- quiet true -> QUIET.
- contextFresh false after route event -> ROUTE_INVALIDATED.

- [ ] **Step 4: Implement resolveWorkflowState**

The resolver is pure: no DOM, storage, window listeners, timers, or UI mutation.

- [ ] **Step 5: Run tests**

Run: node --test tests/ms1/state-resolver.test.js tests/ms1/ui-contract.test.js  
Expected: PASS.

- [ ] **Step 6: Commit**

~~~bash
git add extension/modules/ms1/state/state-resolver.js tests/ms1/state-resolver.test.js
git commit -m "feat: add fail-closed MS1 state resolver"
~~~

---

### Task 4: Canonical Eight-Area / Five-Level Official Content Matrix

**Files:**
- Create: extension/modules/ms1/content/sources.js
- Create: extension/modules/ms1/content/areas.js
- Create: extension/modules/ms1/content/levels.js
- Create: extension/modules/ms1/content/official-criteria.js
- Create: tests/ms1/official-content.test.js

**Interfaces:**
- sources.js exports MS1_SOURCES with:
  - official.id = cam-primary-ms1-official, role = canonical, title = MS1 Report Teacher Guidance
  - interpretive.id = cam-primary-ms1-interpretive, role = interpretive-example, title = MS1 All Levels Complete Bilingual.
- areas.js exports MS1_AREAS in this exact order with stable IDs:
  academic, attitude, behaviour, classwork, communication, collaboration, creativity, equipment.
- levels.js exports MS1_LEVELS in this exact order: EE, AE, ME, BE, WB.
- official-criteria.js exports:
  - OFFICIAL_CRITERIA, a frozen 40-record map keyed areaId:levelCode
  - getOfficialCriterion(areaId, levelCode) -> record|null.
- Each record exact shape:
~~~text
{
  key: "areaId:LEVEL",
  areaId: string,
  levelCode: "EE" | "AE" | "ME" | "BE" | "WB",
  criterion: string,
  sourceId: "cam-primary-ms1-official"
}
~~~

- [ ] **Step 1: Write failing source/area/level tests**

Assertions:
- exactly 2 source definitions with correct roles.
- exactly 8 areas in approved order.
- exactly 5 levels in approved order.
- official classwork display title is exactly "Completion of classwork/Homework (Secondary)".
- no score thresholds, percentages, or TA/EoUQ fields exist in these definitions.

Run: node --test tests/ms1/official-content.test.js  
Expected: FAIL because content modules do not exist.

- [ ] **Step 2: Implement sources.js, areas.js, and levels.js**

Do not mix live DOM aliases into academic content records; DOM matching remains Task 2's responsibility.

- [ ] **Step 3: Add failing 40-cell matrix tests**

Assertions:
- Object.keys(OFFICIAL_CRITERIA).length === 40.
- every area × every level key exists exactly once.
- every record sourceId === cam-primary-ms1-official.
- all returned records/containers are immutable.
- normalized source-exact spot checks include:
  - academic:EE begins "Demonstrates exceptional understanding of concepts" and includes independent application in unfamiliar contexts.
  - academic:WB requires significant support to apply knowledge and skills effectively.
  - attitude:ME says the student approaches learning positively and participates appropriately in classroom activities.
  - classwork:ME states that most assigned classwork/homework is completed and expected requirements are met.
  - equipment:WB states that the student frequently arrives unprepared and requires regular reminders regarding equipment/resources.

- [ ] **Step 4: Transcribe all 40 official criteria from MS1 Report Teacher Guidance(5).pdf**

Only normalize line-wrap whitespace. Do not paraphrase, modernize, shorten, translate, or substitute text from the bilingual guide.

If the canonical source cannot be retrieved during execution, STOP this task and ask for the source; do not fill gaps from model knowledge.

- [ ] **Step 5: Run source matrix tests**

Run: node --test tests/ms1/official-content.test.js  
Expected: PASS with exactly 40 canonical records.

- [ ] **Step 6: Commit**

~~~bash
git add extension/modules/ms1/content/sources.js extension/modules/ms1/content/areas.js extension/modules/ms1/content/levels.js extension/modules/ms1/content/official-criteria.js tests/ms1/official-content.test.js
git commit -m "feat: add canonical MS1 rubric content matrix"
~~~

---

### Task 5: Source-Backed Derived Guidance, Explicit VI Assist, and Subject Examples

**Files:**
- Create: extension/modules/ms1/content/plain-explanations.js
- Create: extension/modules/ms1/content/classroom-evidence.js
- Create: extension/modules/ms1/content/observation-checklists.js
- Create: extension/modules/ms1/content/comparisons.js
- Create: extension/modules/ms1/content/assist-copy.en.js
- Create: extension/modules/ms1/content/assist-copy.vi.js
- Create: extension/modules/ms1/content/subject-examples/english.js
- Create: extension/modules/ms1/content/subject-examples/maths.js
- Create: extension/modules/ms1/content/subject-examples/science.js
- Create: tests/ms1/derived-content.test.js

**Interfaces:**
- Every derived academic item uses parentKey matching one official areaId:LEVEL key and sourceId identifying its source.
- Produces:
  - getPlainExplanation(parentKey, language) -> DerivedText|null
  - getClassroomEvidence(parentKey, language) -> readonly DerivedText[]
  - getObservationChecklist(parentKey, language) -> readonly DerivedPrompt[]
  - getAdjacentComparison(areaId, levelCode, language) -> Comparison|null
- assist-copy modules provide only UI/support labels and the exact final-decision message; they do not define academic criteria.
- Subject files each export one five-level Academic Achievement example map for that subject and source ID cam-primary-ms1-interpretive.

- [ ] **Step 1: Write failing provenance and safety tests**

Assertions:
- every derived item has a parentKey present in OFFICIAL_CRITERIA.
- every interpretive item identifies cam-primary-ms1-interpretive or its official parent source where appropriate.
- no derived text contains score cut-off syntax, confidence percentages, "recommended grade", "Hub thinks", automatic recommendation wording, TA formula, or EoUQ formula.
- adjacent comparisons exist only EE↔AE, AE↔ME, ME↔BE, BE↔WB.
- teacher-decision message is exactly "Use the evidence to compare levels. You make the final judgement."

Run: node --test tests/ms1/derived-content.test.js  
Expected: FAIL because derived content modules do not exist.

- [ ] **Step 2: Implement English derived guidance**

Use the official criterion as the parent rule and the bilingual guide only for classroom interpretation/examples. Observation checklists must be questions/prompts, never points or a scoring algorithm.

- [ ] **Step 3: Add failing VI isolation/source tests**

Assertions:
- default language value in content API is EN.
- VI content is returned only when language === "VI".
- official criterion remains the canonical English record even in VI mode.
- VI derived items are present only where supported by the supplied bilingual source.
- a missing VI derived item returns null/English fallback instruction rather than invented Vietnamese.
- no API reads browser locale, existing Hub locale, or chrome.i18n.

- [ ] **Step 4: Implement assist-copy.en.js / assist-copy.vi.js and source-backed VI derived layers**

VI is an MS1-only view choice. Do not import extension/src/platform/browser/i18n.js and do not write any global Hub language state.

- [ ] **Step 5: Add failing subject-example tests**

Assertions:
- English, Maths, Science each contain EE/AE/ME/BE/WB Academic Achievement examples from the bilingual guide.
- each example is marked interpretive and parented to academic:LEVEL.
- unknown subject returns no example.
- English example never appears for Maths/Science/unknown, and vice versa.

- [ ] **Step 6: Implement subject example modules**

Use only the supplied bilingual source. Do not invent examples for other subjects or other rubric areas.

- [ ] **Step 7: Run content suite**

Run: node --test tests/ms1/official-content.test.js tests/ms1/derived-content.test.js  
Expected: PASS.

- [ ] **Step 8: Commit**

~~~bash
git add extension/modules/ms1/content tests/ms1/derived-content.test.js
git commit -m "feat: add source-backed MS1 guidance layers"
~~~

---

### Task 6: Floating Entry Button, Compact Assistant Panel, and Accessible Motion

**Files:**
- Create: extension/modules/ms1/ui/entry-button.js
- Create: extension/modules/ms1/ui/assistant-panel.js
- Create: extension/modules/ms1/ui/ms1.css
- Create: tests/ms1/helpers/fake-dom.js
- Create: tests/ms1/ui-shell.test.js

**Interfaces:**
- entry-button.js exports:
  - createEntryButton({ document, onOpen, reducedMotion }) -> EntryButtonController
- EntryButtonController:
  - element
  - mount(root)
  - playInitialAttentionOnce()
  - stopAttention()
  - focus()
  - destroy()
- assistant-panel.js exports:
  - createAssistantPanel({ document, onAction, onClose, robotUrl, reducedMotion }) -> AssistantPanelController
- AssistantPanelController:
  - element
  - open(viewModel)
  - render(viewModel)
  - close()
  - showTargetHint({ rect, label })
  - clearTargetHint()
  - destroy()
- onAction values are limited to guide, resume, quiet, reference, continue, show-me.
- UI root ownership remains with Task 8 runtime; these components mount only inside the supplied extension root.

- [ ] **Step 1: Write failing entry-button behavior tests**

Assertions:
- element is a semantic button with accessible label "Get MS1 guidance".
- initial attention class may be added at most once per controller lifetime.
- onOpen fires only from user activation handlers.
- reducedMotion=true never adds spring/bounce motion classes.
- calling stopAttention removes the spring class.
- no timer/setInterval/requestAnimationFrame loop is used.

Run: node --test tests/ms1/ui-shell.test.js  
Expected: FAIL because UI modules do not exist.

- [ ] **Step 2: Implement entry-button.js and the entry CSS**

CSS targets:
- fixed bottom-right circular button;
- ha-ms1-* prefix;
- one-shot keyframes approximately 450–650 ms;
- 14–18 px lift;
- max scale <= 1.08;
- visible :focus-visible ring;
- prefers-reduced-motion disables animation.

- [ ] **Step 3: Add failing panel/accessibility tests**

Assertions:
- panel contains headline "Need help with MS1?".
- actions visible: Guide me, Help me from here, I know already, Quick reference.
- close/collapse leaves entry control untouched.
- Escape invokes close.
- opening moves focus into the panel; closing can return focus to entry via runtime callback.
- robot img is decorative (empty alt and aria-hidden) and missing image cannot suppress text/actions.
- no full-screen backdrop node is created.
- showTargetHint creates only an extension-owned overlay from a supplied rectangle; it never adds classes/attributes to the native target.

- [ ] **Step 4: Implement assistant-panel.js and panel/robot CSS**

Panel width target 360–430 px with viewport-safe max width. Robot bounce is CSS-only, 4–6 px, 1.6–2.0 s/cycle, 2–3 cycles maximum; no recurring JS timer.

- [ ] **Step 5: Run UI shell tests**

Run: node --test tests/ms1/ui-shell.test.js  
Expected: PASS.

- [ ] **Step 6: Commit**

~~~bash
git add extension/modules/ms1/ui/entry-button.js extension/modules/ms1/ui/assistant-panel.js extension/modules/ms1/ui/ms1.css tests/ms1/helpers/fake-dom.js tests/ms1/ui-shell.test.js
git commit -m "feat: add accessible MS1 helper shell"
~~~

---

### Task 7: Contextual Score Inspector and Quick Reference

**Files:**
- Create: extension/modules/ms1/ui/score-inspector.js
- Modify: extension/modules/ms1/ui/assistant-panel.js
- Modify: extension/modules/ms1/ui/ms1.css
- Create: tests/ms1/score-inspector.test.js

**Interfaces:**
- score-inspector.js exports:
  - createScoreInspector({ document, onReferenceLevel, onAssistLanguage }) -> ScoreInspectorController
- ScoreInspectorController:
  - render(viewModel)
  - reset()
  - destroy()
- Contextual viewModel exact fields:
~~~text
{
  mode: "contextual",
  areaId: string,
  officialTitle: string,
  selectedReferenceLevel: "EE" | "AE" | "ME" | "BE" | "WB" | null,
  assistLanguage: "EN" | "VI",
  officialCriterion: object | null,
  plainExplanation: object | null,
  evidence: readonly object[],
  checklist: readonly object[],
  comparison: object | null,
  subjectExample: object | null
}
~~~
- Quick reference is rendered only by assistant-panel.js in REFERENCE mode and may expose an explicit area/level selector labelled "Reference only"; it must not claim live PowerTeacher verification.
- No contextual area picker is shown when a native strand is verified.

- [ ] **Step 1: Write failing contextual inspector tests**

Assertions:
- header displays current verified officialTitle.
- five Hub reference buttons appear in order EE, AE, ME, BE, WB.
- no Hub reference level is selected by default.
- selecting a reference level invokes only onReferenceLevel(code); it never finds/clicks/writes a native control.
- content ladder order is Official criterion → explanation → classroom evidence → observation prompts → optional subject example → adjacent comparison → final-decision message.
- forbidden text "Recommended grade", "Hub thinks", confidence percentage, or scoring formula never renders.

Run: node --test tests/ms1/score-inspector.test.js  
Expected: FAIL because score-inspector.js does not exist.

- [ ] **Step 2: Implement contextual score-inspector.js**

The canonical official criterion remains English in every assist language. VI changes only the support/explanatory layers and their labels.

- [ ] **Step 3: Add failing VI/subject behavior tests**

Assertions:
- inspector opens EN by default.
- explicit VI control changes only onAssistLanguage("VI").
- returning EN changes only MS1 support state.
- unknown subject renders no subject example.
- class/context reset from runtime resets selectedReferenceLevel to null and assistLanguage to EN.
- global Hub/browser locale is never read.

- [ ] **Step 4: Implement VI toggle and subject-example slot**

VI control is small/secondary and displays VI while EN is active, EN while VI is active.

- [ ] **Step 5: Add failing Quick Reference tests**

Assertions:
- Quick Reference can render source-backed area/level content with no verified native cell.
- it is visibly labelled as reference-only.
- it cannot set academic eligibility or selected native strand.
- closing reference returns to the assistant panel without native mutation.

- [ ] **Step 6: Implement reference rendering in assistant-panel.js**

Reference mode may provide its own area/level chooser because it is not the primary contextual live flow.

- [ ] **Step 7: Run UI tests**

Run: node --test tests/ms1/ui-shell.test.js tests/ms1/score-inspector.test.js  
Expected: PASS.

- [ ] **Step 8: Commit**

~~~bash
git add extension/modules/ms1/ui tests/ms1/score-inspector.test.js
git commit -m "feat: add contextual MS1 score inspector"
~~~

---

### Task 8: Teacher-Led Walkthrough Runtime, Scoped Native Observation, and Route Invalidation

**Files:**
- Create: extension/modules/ms1/runtime/ms1-runtime.js
- Create: extension/modules/ms1/bootstrap/content.js
- Create: tests/ms1/runtime.test.js

**Interfaces:**
- ms1-runtime.js exports:
  - createMs1Runtime({ window, document, adapter, resolver, content, ui }) -> Ms1Runtime
- Ms1Runtime methods:
  - start()
  - stop()
  - reconcile(trigger)
  - invalidate(reason)
  - snapshot()
- snapshot exact fields:
~~~text
{
  started: boolean,
  state: string,
  panelOpen: boolean,
  quiet: boolean,
  referenceMode: boolean,
  contextFresh: boolean,
  contextEpoch: number,
  selectedReferenceLevel: string | null,
  assistLanguage: "EN" | "VI",
  listenersBound: { hashchange: boolean, popstate: boolean, grid: boolean }
}
~~~
- bootstrap/content.js assembles the globals and starts exactly one runtime instance at PSQM.ms1Lab.runtime.

- [ ] **Step 1: Write failing one-root/idempotent-start tests**

Assertions:
- wrong host/path -> no root and no runtime UI.
- valid host -> exactly one #hub-assistant-ms1-root direct child of body.
- repeated start/open/collapse/wake does not duplicate root.
- hashchange/popstate listeners bind once.
- stop removes extension listeners/root and reaches STOPPED.

Run: node --test tests/ms1/runtime.test.js  
Expected: FAIL because runtime module does not exist.

- [ ] **Step 2: Implement start/stop/root ownership and in-memory UI state**

On first eligible mount:
- entry spring may play once;
- no persistence/storage is used;
- assistLanguage starts EN;
- selectedReferenceLevel starts null.

- [ ] **Step 3: Add failing Guide me / Help me from here tests**

Guide me and resume must map resolver states to teacher-led guidance:
- NAV_NEED_GRADING -> explain/highlight #sidebar-charms-grading.
- NAV_NEED_STANDARDS -> explain/highlight #grading-standards-link when present.
- MS1_NEED_FILTER -> point to #special-functions and instruct teacher to choose Show Filter.
- MS1_NEED_QUERY -> point to #simple-search-standard-final-grades and instruct teacher to type MS1 manually.
- MS1_CONTEXT_UNVERIFIED -> explain that the teacher should navigate native standard columns and open a rubric cell; no automatic paging/clicking.
- eligible -> render contextual Score Inspector.
- I know already -> QUIET for this runtime/session only while entry stays available.
- Quick reference -> REFERENCE without asserting current eligibility.

- [ ] **Step 4: Implement walkthrough orchestration**

show-me uses getBoundingClientRect once on explicit action and the extension-owned hint overlay. Never scroll/click the native control.

- [ ] **Step 5: Add failing scoped grid-reconcile tests**

When a verified Standards grid exists:
- bind at most one delegated click listener to that grid.
- a user click whose target resolves to td.standard-col schedules exactly one queueMicrotask reconcile after the native handler.
- the runtime does not invoke target.click() or dispatchEvent().
- replacing/invalidating context removes the old grid listener before a new one is bound.
- non-standard grid clicks do not trigger academic reconcile.

This is the only automatic cell-context observation allowed by this plan; no MutationObserver or document-wide click listener.

- [ ] **Step 6: Implement scoped grid listener**

Use teacher-triggered native click as the bounded signal. If the native inspector/cell relation cannot be verified on the read that follows, fail closed and keep generic help.

- [ ] **Step 7: Add failing D8 route/class invalidation tests**

Fixture transition:
- before: course "2L7I English (Tiếng Anh)", routePath "/classes/final_grades", filter "MS1", selected strand Equipment, native inspector open.
- route event occurs.
- after adapter snapshot: course "2L8I English (Tiếng Anh)", same routePath, filter still "MS1", no selected cell, inspector closed, visible headers are look-alikes.

Assertions immediately on hashchange OR popstate:
- contextFresh false;
- contextEpoch increments once per invalidation cycle, not once per duplicate event pair;
- selectedReferenceLevel reset null;
- assistLanguage reset EN;
- stale Score Inspector removed/neutralized;
- old grid listener removed;
- academic eligibility false before fresh explicit/teacher-triggered reconcile.

After fresh reconcile:
- persisted MS1 filter alone remains ineligible.

- [ ] **Step 8: Implement coalesced route invalidation without polling/timers**

Treat hashchange/popstate as invalidation signals. Coalesce a same-turn duplicate pair synchronously/microtask-safe so one class transition does not double-reset UI. Do not depend on routePathChanged.

- [ ] **Step 9: Run runtime regression**

Run: node --test tests/ms1/runtime.test.js tests/ms1/state-resolver.test.js tests/ms1/ui-contract.test.js  
Expected: PASS.

- [ ] **Step 10: Commit**

~~~bash
git add extension/modules/ms1/runtime/ms1-runtime.js extension/modules/ms1/bootstrap/content.js tests/ms1/runtime.test.js
git commit -m "feat: add teacher-led MS1 lab runtime"
~~~

---

### Task 9: Deterministic Standalone Lab Build + Static Safety Gates

**Files:**
- Create: tools/build-ms1-lab.mjs
- Create: tests/ms1/build-lab.test.js
- Create: tests/ms1/security-performance-static.test.js
- Generated: dist/ms1-lab/**
- Modify: extension/modules/ms1/README.md only if build/run instructions need final alignment

**Interfaces:**
- build-ms1-lab.mjs takes no network input and writes only dist/ms1-lab.
- Generated Lab manifest:
  - manifest_version: 3
  - name: Hub Assistant — MS1 Lab
  - version: 0.1.0
  - matches/host boundary only https://vas.powerschool.com/teachers/*
  - no background service worker
  - no popup
  - no storage permission
  - no external resources
  - content script loads only extension/modules/ms1 canonical files in deterministic dependency order
  - CSS: modules/ms1/ui/ms1.css
  - robot asset exposed only to the PowerTeacher host.
- BUILD_INFO.json fields:
  - protectedBase
  - sourceSpec
  - sourcePlan
  - sourceCommit from git rev-parse HEAD
  - labVersion
- SHA256SUMS.txt contains stable sorted checksums for every generated file except SHA256SUMS.txt itself.

- [ ] **Step 1: Write failing build manifest/isolation tests**

Assertions after running the future builder:
- dist/ms1-lab/manifest.json exists.
- Lab name/version exact.
- only PowerTeacher teacher host is matched.
- no vas.educator.powerschool.com PowerHub content script.
- no extension/src/** production runtime is copied.
- no background/popup/storage permission.
- canonical modules are copied once.
- robot-assistant.png is local and declared web-accessible only for the PowerTeacher host.
- no Store ZIP path is created/overwritten.

Run: node --test tests/ms1/build-lab.test.js  
Expected: FAIL because builder/dist do not exist.

- [ ] **Step 2: Implement deterministic build-ms1-lab.mjs**

Build order:
1. remove only dist/ms1-lab;
2. recreate target folders;
3. copy extension/modules/ms1 recursively;
4. copy extension/assets/robot-assistant.png;
5. generate manifest with deterministic content-script order;
6. generate BUILD_INFO.json without wall-clock timestamp;
7. generate sorted SHA256SUMS.txt.

Do not mutate extension/manifest.json.

- [ ] **Step 3: Add failing static safety/performance tests**

Scan extension/modules/ms1/**/*.js and generated manifest for forbidden runtime primitives:
- MutationObserver
- setInterval
- fetch(
- XMLHttpRequest
- WebSocket
- localStorage
- sessionStorage
- chrome.storage
- navigator.sendBeacon
- .click(
- dispatchEvent(
- production PowerHub host vas.educator.powerschool.com.

Also assert:
- no more than one registration site each for hashchange and popstate in runtime source.
- no infinite CSS animation (animation-iteration-count: infinite or "infinite" token).
- no runtime reference to Angular scope/controller APIs.
- no grade/save/publish/send automation selectors or functions.

- [ ] **Step 4: Implement/fix until static gates pass**

Do not weaken the static test to accommodate an unsafe implementation; adjust runtime instead.

- [ ] **Step 5: Build and verify checksums**

Run: npm run build:ms1-lab  
Expected: dist/ms1-lab created.

Run: node --test tests/ms1/build-lab.test.js tests/ms1/security-performance-static.test.js  
Expected: PASS and every SHA256SUMS entry matches current bytes.

- [ ] **Step 6: Run full deterministic verification**

Run: npm test  
Expected: existing Phase 0 PASS.

Run: npm run test:ms1  
Expected: all MS1 tests PASS.

Run: node --check on every JS/MJS file under extension/modules/ms1, tests/ms1, and tools/build-ms1-lab.mjs.  
Expected: PASS.

Run: npm run build:ms1-lab twice from the same source commit and compare generated file hashes.  
Expected: identical SHA256SUMS.txt.

Run: git diff --binary --exit-code bcd9cb7996247c1f32706c9b41449ac947e7bb15 -- extension/manifest.json extension/src extension/assets  
Expected: no diff in protected production files.

- [ ] **Step 7: Commit**

~~~bash
git add tools/build-ms1-lab.mjs tests/ms1/build-lab.test.js tests/ms1/security-performance-static.test.js extension/modules/ms1/README.md
git commit -m "build: add deterministic standalone MS1 lab"
~~~

Do not commit dist/ms1-lab unless the repository's existing policy explicitly tracks generated Lab artifacts; otherwise keep it generated for smoke testing.

---

### Task 10: Whole-Branch Acceptance Review and Authorized Live Smoke Handoff

**Files:**
- Modify only if findings require documentation fixes:
  - docs/ms1/evidence/MS1_DOM_EVIDENCE_SANITIZED.md
  - docs/ms1/evidence/MS1_UI_CONTRACT.md
  - extension/modules/ms1/README.md
- No runtime change is allowed in this task unless a failed deterministic test is first added/reproduced in the owning earlier task.

**Interfaces:**
- Consumes: completed Tasks 1–9 and generated dist/ms1-lab.
- Produces: a reviewable branch at deterministic PASS and an explicit manual smoke checklist. This task does not merge or publish.

- [ ] **Step 1: Run full branch diff review**

Confirm:
- only docs/tests/tools/package.json/extension/modules/ms1 and optionally untracked dist/ms1-lab changed from the approved starting point.
- extension/manifest.json and extension/src/** have no MS1 Lab implementation edits.
- no unrelated refactor.
- no production Store ZIP change.

- [ ] **Step 2: Run all deterministic gates from Task 9**

Expected: all PASS before live smoke.

- [ ] **Step 3: Load dist/ms1-lab as an unpacked development extension in an authorized test browser/profile**

Manual smoke sequence:
1. open PowerTeacher authorized test class;
2. confirm one floating ? and no native layout obstruction;
3. verify one finite spring; reduced-motion path separately if available;
4. open panel and confirm finite Error Bot bounce;
5. Guide me: Grading → Standards, with highlight/explanation only;
6. verify hidden-filter and already-visible-filter branches;
7. manually enter MS1;
8. verify TA Grade / TA Score / VN Ranking / Unit / LSPC never open contextual academic guidance;
9. page native standard columns and verify a live canonical rubric strand can activate without all eight strands rendered;
10. open a blank rubric cell manually and verify Score Inspector follows that strand;
11. verify Hub EE/AE/ME/BE/WB controls change only Hub explanatory content and do not alter PowerSchool;
12. verify VI appears only after explicit click and does not change global Hub/native locale;
13. verify unknown subject does not show another subject's example;
14. switch class while Score Inspector is open; confirm old guidance invalidates even though normalized route path remains /classes/final_grades and MS1 filter may persist;
15. confirm no duplicate root/listeners after collapse/wake/re-entry;
16. confirm no attributable console error or obvious CPU spike.

- [ ] **Step 4: If live smoke exposes a bug, reproduce it deterministically first**

Add the smallest failing test to the owning task's test file, then fix only that boundary and rerun full deterministic verification. Do not patch live-only behavior without a reproducible contract unless technically impossible; if impossible, document the limitation before changing code.

- [ ] **Step 5: Record final PASS metadata**

Handoff must state:
- branch name;
- final commit SHA;
- protected base SHA;
- Final Spec commit SHA a56ceafa3d022042c87b178243f51e058efcc8a0;
- Lab version 0.1.0;
- SHA256SUMS location;
- deterministic commands/results;
- live smoke result;
- known limitations;
- rollback: disable/remove the unpacked MS1 Lab; production Hub Assistant remains unchanged because no production runtime/manifest integration occurred.

- [ ] **Step 6: Final review commit only if documentation changed**

~~~bash
git add docs/ms1/evidence extension/modules/ms1/README.md
git commit -m "docs: finalize MS1 lab validation handoff"
~~~

If no documentation changed, do not create an empty commit.

---

## Plan Self-Review Checklist

- Spec coverage: every Final Spec section maps to at least one task; official content, VI isolation, subject overlays, teacher control, performance, privacy, accessibility, motion, route invalidation, build isolation, deterministic tests, and live smoke are covered.
- G0 reconciliation: plan does not require simultaneous 8/8 DOM presence; it explicitly allows paginated partial strands.
- Live alias honesty: only Academic/Attitude/Behaviour/Equipment code aliases are marked live-verified; remaining categories rely on exact official title matching until later evidence.
- Route safety: same-path class switches invalidate context; persisted MS1 filter is not eligibility.
- Cell mapping: no fixed absolute cellIndex dependency.
- Type consistency: Task 2 snapshot feeds Task 3 resolver; Task 8 consumes both without renaming fields.
- Language safety: EN default; VI explicit/local; no global locale dependency; unsupported VI content is not invented.
- Teacher control: no synthetic native action is authorized anywhere.
- Performance: no broad observer/polling/recurring timer; only bounded route listeners and one scoped grid click listener.
- Isolation: production manifest/runtime remain protected; Lab build uses only canonical extension/modules/ms1 source.
- Proportion: plan specifies interfaces, tests, and decisions without transcribing implementation bodies.
