# MS1 Isolated Lab — Design Specification

**Date:** 2026-10-04  
**Status:** DRAFT FOR USER REVIEW — implementation is not authorized yet  
**Repository:** `artporttrairt-stack/Powerhub_assistant`  
**Design branch:** `feature/ms1-isolated-lab`  
**Protected base:** `main @ bcd9cb7996247c1f32706c9b41449ac947e7bb15`

## 1. Purpose

Build and validate a complete MS1 Teacher Support experience for PowerTeacher as an isolated, testable module before integrating it into the production Hub Assistant runtime.

The intended user is a teacher who may be low-tech, time-pressured, or overwhelmed. The experience must reduce cognitive load without taking control of PowerSchool actions or making academic decisions for the teacher.

The product goal is:

```text
PowerTeacher stays the source of truth and the work surface.
Hub Assistant notices where the teacher is,
guides the next safe manual step,
and explains the MS1 rubric in context.
```

This specification covers:

1. isolated MS1 Lab architecture;
2. PowerTeacher DOM inspection contract;
3. floating `?` entry affordance;
4. approved Error Bot / robot presentation;
5. MS1 walkthrough;
6. contextual Score Inspector;
7. source-of-truth and academic-content rules;
8. safety, privacy, accessibility, performance, and test gates.

This specification does **not** authorize product implementation. After this document is reviewed, the next required stage is G0 live DOM inspection. The implementation plan is written only after the inspection evidence is reconciled back into this spec.

---

## 2. Source authority

### 2.1 Canonical academic source

Canonical source ID:

`cam-primary-ms1-official`

Canonical document:

`MS1 Report Teacher Guidance(5).pdf`

The canonical source defines:

- the Mid-Semester report rubric;
- 8 categories;
- 5 levels;
- the official criterion wording for every category/level;
- the official PowerSchool completion flow.

The official PowerSchool flow is:

1. Open PowerTeacher Pro Gradebook.
2. Select **Grading → Standards**.
3. Open Settings / gear → **Show Filter**.
4. Search `MS1`.
5. Complete by typing the correct code or selecting it from the native sidebar.

The five official level codes are:

- `EE` — Exceeding Expectations
- `AE` — Above Expectations
- `ME` — Meeting Expectations
- `BE` — Below Expectations
- `WB` — Well Below Expectations

The eight official categories are:

1. Academic Achievement
2. Attitude Towards Learning
3. Behaviour and Personal Development
4. Completion of classwork/Homework (Secondary)
5. Communication Skills
6. Working Collaboratively
7. Creativity and Critical thinking
8. Equipment and Resources

### 2.2 Interpretive support source

Interpretive source ID:

`cam-primary-ms1-interpretive`

Document:

`MS1_All_Levels_Complete_Bilingual.pdf`

This source may provide:

- plain-language explanations;
- bilingual classroom descriptions;
- observable classroom evidence;
- observation prompts;
- English / Maths / Science examples;
- adjacent-level interpretation support.

It may **not**:

- replace an official criterion;
- broaden or contradict an official criterion;
- create score thresholds;
- create percentages;
- create a grading formula;
- convert checklist counts into a level;
- recommend a final level automatically.

The document explicitly describes its subject examples as illustrative classroom evidence, not official score cut-offs.

### 2.3 Source precedence

When sources conflict:

```text
MS1 Report Teacher Guidance
        >
MS1 All Levels Complete Bilingual
        >
derived journey-map / implementation notes
```

Journey maps and HAR-derived metadata are implementation evidence, not academic authority.

### 2.4 Language-system boundary: Hub locale vs MS1 VI assist

There are **two independent language systems** and they must never be coupled.

#### A. Hub UI locale

The existing Hub Assistant language/native-language system owns generic extension chrome such as global onboarding or generic interface labels.

This MS1 design does not redefine that system.

The MS1 module must not read or write the global Hub language setting merely to decide which academic rubric language to show.

#### B. MS1 academic assist language

MS1 academic content is **English-first by design** because the Cambridge reporting workflow is completed in English.

This does **not** mean the academic subject must be English. Maths, Science, or another Cambridge subject may still use the same English-first MS1 rubric. The rule concerns the reporting/content language, not the subject identity.

Vietnamese is an optional fatigue-relief layer for local Cambridge teachers who may want help interpreting English rubric content while completing many reports.

Therefore:

- default MS1 academic content language = `EN`;
- Vietnamese is not shown by default;
- Vietnamese is never auto-selected from browser language;
- Vietnamese is never auto-selected from Hub's global/native UI locale;
- Vietnamese is never treated as the preferred or primary display language;
- a small explicit `VI` control reveals/switches the MS1 support content to Vietnamese only when the teacher asks for it;
- switching MS1 content to `VI` does not change Hub's global UI language;
- changing Hub's global UI language does not change the MS1 academic assist language;
- the MS1 assist-language choice is ephemeral to the active MS1 help context unless a later approved spec explicitly introduces persistence.

Source-integrity rule:

- the canonical official criterion remains the English official source;
- when `VI` assist mode is active, source-backed Vietnamese explanatory/interpretive content may replace the visible support layers;
- do not label an interpretive Vietnamese rendering as an official translation unless an authoritative translated source explicitly supports that claim;
- where no source-backed Vietnamese support exists, keep the English source text rather than inventing a translation.

### 2.5 Teacher Assessment Grade is a different workflow

Teacher Assessment Grade (TA Grade) must not be treated as the MS1 eight-strand rubric.

Known distinct TA identifiers include:

- `MS1-TA-Score`
- `MS1-TA-Grade`
- `MS1-LSPC.*`
- `MS1-Unit1.*`
- VN Ranking / rank fields

TA Grade has separate subject-skill / EoUQ logic and must never be used as evidence that the 8-strand MS1 rubric is active.

---

## 3. Isolation architecture

### 3.1 Branch strategy

Development branch:

`feature/ms1-isolated-lab`

It is based directly on:

`main @ bcd9cb7996247c1f32706c9b41449ac947e7bb15`

The existing Stage 2 branch is reference/donor material only. It is not the new branch base.

### 3.2 Protected production boundary

Until a separate integration specification is approved, the MS1 Lab must not modify production behavior.

Protected baseline includes the existing product runtime and production manifest state from the branch base.

During MS1 Lab development:

- do not refactor existing PowerHub features;
- do not change existing PowerHub load order;
- do not change existing PowerHub background/popup behavior;
- do not add MS1 logic to the old PowerHub runtime;
- do not publish or overwrite a Store ZIP;
- do not merge into `main`.

A deterministic protected-baseline hash gate must later prove that protected production files remain unchanged.

### 3.3 Canonical module shape

Target source shape:

```text
extension/
└── modules/
    └── ms1/
        ├── README.md
        ├── platform/
        │   └── powerteacher/
        │       ├── ui-contract.js
        │       └── ui-adapter.js
        ├── state/
        │   └── state-resolver.js
        ├── content/
        │   ├── sources.js
        │   ├── areas.js
        │   ├── levels.js
        │   ├── official-criteria.js
        │   ├── plain-explanations.js
        │   ├── classroom-evidence.js
        │   ├── observation-checklists.js
        │   ├── comparisons.js
        │   ├── assist-copy.en.js
        │   ├── assist-copy.vi.js
        │   └── subject-examples/
        │       ├── english.js
        │       ├── maths.js
        │       └── science.js
        ├── ui/
        │   ├── entry-button.js
        │   ├── assistant-panel.js
        │   ├── score-inspector.js
        │   └── ms1.css
        ├── runtime/
        │   └── ms1-runtime.js
        └── bootstrap/
            └── content.js

tools/
└── build-ms1-lab.mjs

tests/
└── ms1/

dist/
└── ms1-lab/              # generated artifact, not canonical source
```

The canonical module is the single source used by the standalone Lab and any later production adapter. Do not maintain a second copied MS1 implementation.

### 3.4 Standalone Lab extension

A deterministic build step will later generate:

`dist/ms1-lab/`

The Lab extension:

- has a distinct development name, e.g. **Hub Assistant — MS1 Lab**;
- targets only `https://vas.powerschool.com/teachers/*`;
- loads only the MS1 Lab modules and approved visual asset(s);
- does not load the Phase 1 PowerHub product feature graph;
- does not use the production Hub Assistant Store package as its test artifact.

The Lab exists to isolate MS1 failures from Phase 1 product behavior.

---

## 4. Verified PowerTeacher facts already available

The following facts are already supported by sanitized read-only live evidence and may be carried into G0 inspection as previously verified hypotheses to re-confirm, not re-invent.

### 4.1 Platform boundary

Expected host/path:

`https://vas.powerschool.com/teachers/*`

Raw query IDs such as `sectionId` must never become persistent application identity.

### 4.2 Verified UI selectors

| UI fact | Current verified selector / rule |
| --- | --- |
| Grading navigation | `#sidebar-charms-grading` |
| Standards navigation | `#grading-standards-link` |
| Standards semantic container | `#section-mega-menu` |
| Standards grade grid | `#standard-final-grades` |
| Standards page gear / Special Functions | `#special-functions` |
| dynamic Show/Hide Filter toggle | `#hide-filter`; interpret its visible semantic label |
| Standards filter input | `#simple-search-standard-final-grades` |
| current course label | `.course-name` |
| standard-header candidate | `th.standard-column-header.standard-col` inside `#standard-final-grades` |
| route invalidation signals | `hashchange`, `popstate` |

Computed visibility is state truth for dynamic controls. Element presence alone is not sufficient.

Route family alone is not proof of Standards state.

### 4.3 Known live DOM caution

A previous live probe observed look-alike MS1 columns such as a Teacher Assessment Grade marker and VN Ranking marker in the same broad Standards surface.

Therefore:

**generic `MS1` text is insufficient to activate the MS1 rubric.**

---

## 5. G0 DOM inspection contract

G0 is one structured forensic session, not an open-ended chain of small probes.

No MS1 Lab runtime implementation begins until G0 evidence is complete enough for the stop condition below.

### 5.1 D0 — page and course context

Teacher action:

- open an authorized test class in PowerTeacher.

Capture only sanitized semantic evidence for:

- route family;
- visible course/class label;
- current high-level page;
- Grading availability.

Do not persist:

- raw `sectionId`;
- student ID;
- teacher ID;
- person ID;
- raw URL/query string.

### 5.2 D1 — Grading

Teacher manually opens Grading.

Inspect:

- Grading active semantics;
- Standards navigation availability;
- stable parent/role/aria evidence if needed.

PASS when the adapter can distinguish:

`Grading available` vs `Grading active`.

### 5.3 D2 — Standards

Teacher manually opens Standards.

Inspect:

- `#section-mega-menu` Standards semantics;
- computed-visible `#standard-final-grades`;
- duplicate/ambiguous grid count;
- page gear availability.

PASS when Standards state can be proven without relying on the URL alone.

### 5.4 D3 — filter hidden/open

Capture both states if available:

- filter hidden;
- filter visible.

Inspect:

- `#special-functions`;
- `#hide-filter`;
- its visible label `Show Filter` / `Hide Filter`;
- computed visibility of `#simple-search-standard-final-grades`.

The element ID name is not state truth.

### 5.5 D4 — search `MS1`

Teacher manually types `MS1` into the native filter.

Capture a sanitized list of **all computed-visible standard headers** within the Standards grid.

For each header capture only:

- tag;
- stable non-PII class;
- non-numeric ID if present;
- `role`;
- `aria-label`;
- `title`;
- semantic `data-*` attributes where non-sensitive;
- normalized visible text;
- DOM position / relation required to disambiguate headers.

The purpose is to distinguish the actual 8-strand MS1 set from:

- TA Grade;
- TA Score;
- VN Ranking;
- Unit Quiz;
- LSPC;
- other look-alike MS1 columns.

### 5.6 D5 — eight-strand semantic mapping

Map live rendered DOM aliases to exactly eight canonical groups.

Provisional canonical implementation labels, supported by current metadata and source naming, are:

- `MS1-Academic`
- `MS1-Attitude`
- `MS1-Behaviour`
- `MS1-Classwork`
- `MS1-Communication`
- `MS1-Collaboratively`
- `MS1-Creativity`
- `MS1-Equipment`

These identifiers are **not yet promoted to final live DOM aliases by this spec**.

G0 must determine what PowerTeacher actually renders.

PASS requires one unambiguous mapping for every official category.

### 5.7 D6 — native cell-to-strand mapping

Teacher manually opens one **blank MS1 cell** in an authorized test context without choosing a grade.

Capture only the structural relation necessary to determine:

- which strand the cell belongs to;
- whether a native inspector/sidebar opens;
- stable role/aria/data semantics of the selected cell and inspector.

Do not capture the student's identity or existing grades.

### 5.8 D7 — native level choices

With the native control open, inspect available level options without selecting one.

PASS for this MS1 rubric requires native evidence compatible with:

`EE / AE / ME / BE / WB`

If another scale appears, academic MS1 guidance must fail closed.

Metadata such as scale ID `5407` may be used as corroborating evidence when available, but it is **not a DOM requirement unless G0 proves it is exposed safely and stably**.

### 5.9 D8 — class/route switch

Change route/class manually.

Verify:

- old cell/strand context becomes invalid;
- old Score Inspector guidance is removed or invalidated immediately;
- new guidance requires a fresh DOM read;
- no raw old section identity is retained.

### 5.10 G0 stop condition

Stop DOM inspection once all of the following are proven:

```text
Standards state
+ Filter state
+ complete 8-strand mapping
+ cell -> strand mapping
+ native EE/AE/ME/BE/WB compatibility
+ route/class invalidation behavior
```

Do not continue into Angular controllers, internal services, or network payloads merely because they are available.

### 5.11 G0 artifacts

Inspection must produce sanitized evidence artifacts such as:

```text
docs/ms1/evidence/MS1_DOM_EVIDENCE_SANITIZED.md
docs/ms1/evidence/MS1_UI_CONTRACT.md
tests/ms1/fixtures/ms1-dom-contract.json
```

Exact paths may be finalized in the implementation plan after this spec is approved.

---

## 6. Entry experience — floating `?`

### 6.1 Intent

The teacher should immediately notice that help exists without being blocked by a modal, onboarding wizard, or full-page takeover.

The primary entry affordance is a floating circular `?` button near the bottom-right edge of PowerTeacher.

The `?` button may appear as soon as:

- the exact PowerTeacher host/path is verified;
- a safe extension-owned mount root can be inserted.

Its presence does **not** assert that the current page is a verified MS1 rubric context.

### 6.2 First-entry spring

On the first eligible mount in the current tab/session, the `?` button performs one iOS-inspired spring attention motion.

Design target:

- CSS-only;
- no GIF;
- no video;
- no animation library;
- total sequence approximately 450–650 ms;
- vertical lift approximately 14–18 px;
- small scale overshoot up to approximately `1.08`;
- settle back to `scale(1)`;
- no infinite bouncing;
- no repeated route-by-route attention animation.

Conceptual motion:

```text
rest below / subtle
      ↑
fast spring lift
      ↑ small overshoot
      ↓
soft settle
      ↓
rest
```

The purpose is to invite a click, not to demand attention continuously.

### 6.3 Hover/focus/click

Hover or keyboard focus:

- small scale increase only;
- visible focus ring;
- optional short tooltip: **Get MS1 guidance**.

Click:

- brief press compression;
- open the MS1 helper panel;
- stop all entry attention motion.

### 6.4 Resting state

After first interaction:

- the `?` remains available;
- it does not continue bouncing;
- it acts as the persistent re-open affordance;
- it does not remember a permanent teacher skill classification.

### 6.5 Reduced motion

If `prefers-reduced-motion: reduce` is active:

- do not spring;
- do not bounce the robot;
- use immediate opacity/visibility transitions only.

---

## 7. Assistant panel design

### 7.1 Visual structure

The approved structural direction is a compact floating card near the bottom-right, with the approved Error Bot adjacent to or partially integrated with the card.

It must not become:

- a full-screen backdrop;
- a blocking modal;
- a permanent long sidebar;
- an overlay that obscures required native controls.

Desktop target width:

approximately 360–430 px, responsive to viewport/zoom.

### 7.2 Initial copy hierarchy

Headline:

**Need help with MS1?**

Primary action:

**Guide me**

Secondary action:

**Help me from here**

Tertiary quiet action:

**I know already**

Reference action:

**Quick reference**

### 7.3 Meaning of actions

#### Guide me

Start the MS1 walkthrough from the earliest incomplete safe step.

It may begin with Grading even if the current page is unrelated to Standards.

#### Help me from here

Read the current verified DOM state and resume at the first incomplete step.

This is the preferred option for a teacher who has already started the PowerSchool task.

#### I know already

Collapse the active guidance for the current tab/workflow session.

The `?` remains available.

This action must not store or infer that the teacher is permanently skilled.

#### Quick reference

Open source-backed rubric/reference help without driving navigation.

Quick reference must not imply that current PowerTeacher context has been verified unless it actually has.

---

## 8. Robot motion and identity

### 8.1 Identity

Use the project's approved blue Error Bot visual identity.

Do not redesign the character during implementation.

The visual direction remains:

- worn/scratched blue body;
- rectangular head;
- one X eye;
- one half-lidded eye;
- flexible antenna ending in a gear;
- spring neck;
- claw hands;
- blocky feet;
- visible torso gears.

### 8.2 Gentle bounce

When the assistant panel first opens, the robot performs a small supportive bounce.

Target:

- CSS transform only;
- vertical motion about 4–6 px;
- about 1.6–2.0 s per cycle;
- maximum 2–3 cycles;
- then rest;
- no continuous idle animation.

The movement should read as friendly/alive, not energetic or distracting.

### 8.3 No motion coupling to native DOM

Robot animation must not trigger:

- DOM rescans;
- PowerSchool actions;
- layout measurements in a recurring loop;
- timers that remain active after animation ends.

---

## 9. Walkthrough model

PowerTeacher itself remains the primary workflow. Hub follows the teacher's current state rather than duplicating PowerTeacher in a second wizard.

### 9.1 Happy path

```text
?
↓
Need help with MS1?
↓
Guide me
↓
Grading
↓
Standards
↓
Show Filter, only if needed
↓
Search MS1, only if needed
↓
verify exact MS1 rubric context
↓
teacher works in native Standards grid
↓
teacher opens a native MS1 cell
↓
Contextual Score Inspector
```

### 9.2 Resume behavior

For every step, re-read semantic state.

Examples:

- already in Grading → skip Grading instruction;
- already in Standards → skip navigation steps;
- filter already visible → skip gear / Show Filter;
- filter already contains `MS1` → skip query instruction;
- verified current MS1 cell → open contextual guidance;
- ambiguous state → fail closed to safe generic help.

### 9.3 Teacher interaction rule

Hub may:

- explain;
- highlight;
- point;
- show source-backed reference content.

Hub must not:

- call native `.click()`;
- synthesize native input;
- dispatch native events;
- select a grade;
- type a grade;
- Fill;
- Save;
- Publish;
- Send;
- write comments;
- toggle flags;
- Undo/revert;
- Recalculate Final Grades.

`Show me` means highlight only.

---

## 10. Exact MS1 academic gate

Academic rubric content must not activate from generic `MS1` text.

The final gate is defined by G0 evidence, but its intended shape is:

```text
verified PowerTeacher
+ verified Standards state
+ MS1 filter/context
+ complete eight-strand semantic set
+ native cell maps to one verified strand
+ native scale is compatible with EE/AE/ME/BE/WB
= MS1 academic guidance eligible
```

Negative examples that must not activate the eight-strand rubric:

- only `MS1-TA-Grade`;
- only `MS1-TA-Score`;
- only VN Ranking;
- only Unit Quiz;
- only LSPC;
- generic text `MS1`;
- partial strand set;
- ambiguous duplicate grid;
- incompatible native level scale;
- stale context after class/route change.

---

## 11. Contextual Score Inspector

### 11.1 Trigger

The contextual Score Inspector appears only after the teacher manually opens/selects a native MS1 rubric cell and the module can verify the strand safely.

It follows the native work context rather than forcing the teacher to choose the strand a second time from a Hub area picker.

### 11.2 Header

Show the verified current strand, for example:

**Academic Achievement**

If strand identity is unknown, do not guess. Fall back to generic reference/navigation help.

### 11.3 Level reference controls

Show five compact Hub reference controls:

`EE   AE   ME   BE   WB`

These are **Hub reference controls**, not native PowerSchool grade buttons.

Clicking one changes only the explanatory content displayed in Hub.

It must never write the chosen reference level back into PowerSchool.

### 11.4 Content ladder

For the reference level currently being considered:

1. **OFFICIAL CRITERION**
2. plain-language explanation;
3. classroom evidence;
4. observation questions;
5. optional subject example;
6. adjacent-level comparison;
7. explicit teacher-final-decision message.

### 11.5 Adjacent comparison

Prefer local comparison:

```text
EE ↔ AE
AE ↔ ME
ME ↔ BE
BE ↔ WB
```

The purpose is to distinguish nearby judgement bands, not to recommend a band.

### 11.6 MS1 language assist control

The Score Inspector contains one small, visually secondary language control for the academic support content.

Default:

`EN`

Visible control:

`VI`

Behavior:

- English MS1 content is shown on open;
- Vietnamese content remains hidden;
- pressing `VI` switches only the MS1 academic support layers to Vietnamese;
- after switching, the control may display `EN` as the return action;
- the control must be subtle and secondary to the rubric/level controls;
- it must not become a primary onboarding choice;
- it must not trigger global Hub language changes;
- it must not be triggered by the current Hub/native language automatically.

In `VI` mode, prioritize Vietnamese for:

- plain-language explanation;
- classroom evidence;
- observation questions;
- source-backed interpretive examples.

The canonical English official criterion remains the authority. A Vietnamese support rendering may accompany or replace the visible explanatory layer, but it must not be mislabeled as official unless the supplied source explicitly provides an authoritative official translation.

This `VI` assist exists for local Cambridge teachers working through English-language reporting content repeatedly; it is not a general localization mechanism for Hub Assistant.

### 11.7 Subject overlays

Only source-backed subject examples are allowed.

Current interpretive source supports:

- English;
- Maths;
- Science.

For Academic Achievement, a safely detected matching subject may show the corresponding illustrative example.

Unknown/unmapped subjects:

- show no subject-specific example;
- retain generic official guidance;
- do not borrow an example from another subject.

### 11.8 Teacher decision lock

Always preserve language equivalent to:

**Use the evidence to compare levels. You make the final judgement.**

Forbidden UI:

- `Recommended grade: AE`
- `Hub thinks: ME`
- confidence percentages;
- automatic recommendation badges;
- scoring formulas.

---

## 12. Official wording integrity

### 12.1 40-cell matrix

The final content layer must cover:

`8 categories × 5 levels = 40 official criterion cells`.

Every official cell must carry canonical source provenance.

### 12.2 Derived layers

Every derived explanation/evidence/checklist/example must identify its official parent criterion.

Derived layers are not allowed to introduce new academic rules.

### 12.3 Completion of classwork/Homework wording

The canonical source labels this category:

**Completion of classwork/Homework (Secondary)**

The module must preserve this official wording when showing the official criterion.

A derived journey-map interpretation such as “Primary: grade classwork completion” must **not** silently replace the official wording unless a higher-authority source is supplied and approved.

If Primary-specific interpretation is shown at all, it must be clearly labelled as non-canonical and source-backed. Without such source support, omit it.

---

## 13. State model

The implementation plan may refine names, but behavior must cover these states:

```text
IDLE
ENTRY_VISIBLE
INTRO_OPEN
QUIET
REFERENCE

NAV_NEED_GRADING
NAV_NEED_STANDARDS
STANDARDS_READY
MS1_NEED_FILTER
MS1_NEED_QUERY

MS1_CONTEXT_UNVERIFIED
MS1_CONTEXT_READY
MS1_CELL_CONTEXT
SCORE_INSPECTOR_OPEN

ROUTE_INVALIDATED
UNVERIFIED
STOPPED
```

State is derived from current DOM plus ephemeral UI state.

Do not persist:

- student identity;
- raw class/section ID;
- teacher skill level;
- selected academic judgement;
- grades;
- rubric decisions.

---

## 14. Route and stale-context behavior

On `hashchange` or `popstate`:

1. immediately invalidate current native strand/cell context;
2. close or neutralize stale Score Inspector content;
3. retain only safe UI shell state where appropriate;
4. require a fresh semantic DOM read before academic guidance resumes.

Old class/strand guidance must never carry forward into a new class.

No polling is used to wait for the new page.

A future plan may use a bounded explicit re-check triggered by:

- teacher presses **Continue**;
- teacher presses **Help me from here**;
- approved native route event;
- another explicitly approved bounded signal found during G0.

---

## 15. Performance constraints

The MS1 Lab must not add:

- a broad `MutationObserver(document.body)`;
- polling;
- `setInterval`;
- repeated full-document scans;
- per-rubric-pack observers;
- duplicate route listeners;
- always-running animation timers;
- network calls for guidance content.

Prefer:

- scoped selectors;
- explicit semantic reads;
- route invalidation;
- teacher-triggered reconcile;
- CSS-only transitions/motion.

The content pack itself must have no DOM, storage, or network dependency.

---

## 16. Privacy and security constraints

The module must not persist or transmit:

- student names;
- teacher names;
- raw section IDs;
- student/person/user IDs;
- emails;
- auth data;
- cookies;
- tokens;
- grades;
- comments;
- SIS payloads.

DOM inspection fixtures must be sanitized before entering the repository.

No new external backend/analytics endpoint is part of this design.

---

## 17. Accessibility

Required:

- keyboard-focusable `?` and panel actions;
- visible focus states;
- semantic button roles;
- panel text readable at browser zoom;
- no information conveyed by animation alone;
- `prefers-reduced-motion` support;
- robot imagery decorative unless it carries text-equivalent meaning;
- guidance remains usable if image asset fails to load.

The teacher must be able to dismiss/collapse help without completing the walkthrough.

---

## 18. Visual behavior acceptance criteria

### Floating `?`

PASS when:

- one and only one entry control exists;
- first eligible mount runs at most one short spring sequence;
- it settles completely;
- it remains clickable after settling;
- route changes do not restart the attention animation repeatedly;
- reduced-motion disables movement;
- opening the panel stops the attention animation.

### Robot

PASS when:

- approved Error Bot identity is preserved;
- opening panel triggers only a small finite bounce;
- motion stops after at most 2–3 cycles;
- reduced-motion disables it;
- no JS animation loop remains active.

### Panel

PASS when:

- the four actions are visible and understandable;
- no native PowerTeacher control is blocked;
- no full-screen backdrop is required;
- responsive/zoomed layouts remain usable;
- collapse leaves the `?` entry available.

---

## 19. Deterministic test requirements for the future implementation plan

These are acceptance requirements, not implementation tasks yet.

### 19.1 Isolation

- branch protected baseline matches expected base;
- protected Phase 1 / production files remain unchanged;
- production manifest remains unchanged by the Lab implementation unless a later integration spec explicitly authorizes it;
- generated Lab package is separate.

### 19.2 Platform/DOM contract

Tests must cover:

- wrong host → no Lab runtime;
- Standards verified only by composite state;
- filter visible/hidden;
- semantic Show/Hide Filter handling;
- complete eight strands → eligible;
- partial strands → fail closed;
- look-alike TA/Ranking columns → fail closed;
- ambiguous grid → fail closed;
- stale route context → fail closed.

### 19.3 Academic content

Tests must cover:

- all 40 official cells present;
- official source ID on every official cell;
- every derived item traces to official parent;
- no thresholds/formulas/recommendation language;
- English academic content is the default;
- MS1 `VI` assist state is independent from Hub/global UI locale;
- Hub/global locale changes do not auto-switch MS1 content language;
- `VI` content appears only after explicit teacher action;
- returning to `EN` affects only MS1 support content;
- no unsupported Vietnamese translation is invented;
- subject overlay optional;
- unknown subject does not leak another subject example;
- adjacent comparison valid;
- teacher-decision message retained.

### 19.4 Teacher control

Static/runtime tests must prove absence of academic/native automation:

- no native `.click()`;
- no native `dispatchEvent()`;
- no grade write;
- no Fill/Save/Publish/Send automation;
- no comment/flag/Undo automation.

### 19.5 Runtime/performance

Tests must prove:

- one extension-owned root;
- no duplicate listener registration after open/collapse/wake;
- no broad MutationObserver;
- no polling;
- no recurring animation timer;
- route invalidation removes stale academic context.

### 19.6 Motion

Tests must prove state/class behavior for:

- first-entry spring;
- no repeat after interaction;
- finite robot bounce;
- reduced-motion path.

---

## 20. Live validation requirements

The Lab is not considered complete from deterministic tests alone.

Authorized live PowerTeacher smoke must validate:

1. `?` appears once and does not disrupt native layout;
2. spring animation feels visible but non-annoying;
3. panel opens and robot finite-bounces;
4. Guide me reaches Grading → Standards;
5. Help me from here resumes correctly;
6. filter hidden path works;
7. filter already visible path skips correctly;
8. `MS1` already entered path skips correctly;
9. actual 8-strand DOM context is recognized;
10. TA Grade / VN Ranking look-alikes do not activate rubric;
11. current native cell maps to the correct strand;
12. native EE/AE/ME/BE/WB compatibility is verified;
13. Score Inspector follows current strand;
14. no grade is automatically selected or written;
15. collapse/wake has no duplicate UI;
16. route/class switch drops stale guidance;
17. no attributable console error or obvious CPU spike.

A live failure must be reproduced deterministically before changing runtime logic whenever feasible.

---

## 21. Spec → Inspect → Plan gate sequence

This design intentionally separates product intent from DOM assumptions.

```text
STEP 1 — WRITTEN SPEC
        ↓
USER REVIEWS SPEC
        ↓
STEP 2 — G0 LIVE DOM INSPECTION
        ↓
SANITIZED EVIDENCE + UI CONTRACT
        ↓
STEP 3 — RECONCILE FINAL SPEC
        ↓
USER APPROVES FINAL SPEC
        ↓
STEP 4 — WRITE IMPLEMENTATION PLAN
        ↓
USER APPROVES PLAN + EXECUTION METHOD
        ↓
STEP 5 — IMPLEMENT MS1 ISOLATED LAB
        ↓
DETERMINISTIC VERIFICATION
        ↓
AUTHORIZED LIVE SMOKE
        ↓
MS1 LAB PASS
        ↓
SEPARATE FUTURE PRODUCTION-INTEGRATION SPEC
```

No implementation task may bypass this sequence.

---

## 22. Decisions locked by this draft

The following are deliberate design decisions, not placeholders:

1. MS1 develops first as an isolated Lab/module.
2. The branch starts from protected `main`, not from the integrated Stage 2 branch.
3. PowerTeacher stays the work surface; Hub does not create a duplicate grading workflow.
4. The `?` is the persistent entry affordance.
5. First entry uses one finite iOS-inspired spring.
6. Robot uses one finite gentle bounce sequence when the panel opens.
7. Animation is CSS-only and reduced-motion aware.
8. Guide me = full resume-aware walkthrough.
9. Help me from here = semantic current-state resume.
10. I know already = session/workflow quiet only; `?` remains callable.
11. Quick reference = source-backed reference without claiming verified current context.
12. Score Inspector is contextual to the native strand/cell; no duplicate area picker in the primary live flow.
13. Complete 8-strand context is required before academic MS1 guidance.
14. TA Grade / TA Score / Ranking / LSPC / Unit Quiz are not the 8-strand MS1 rubric.
15. Official source wins over bilingual/derived material.
16. English is the default MS1 academic content language.
17. `VI` is an explicit, secondary MS1-only assistance control for local Cambridge teachers; it is not linked to Hub's global/native language.
18. English/Maths/Science examples are optional interpretive overlays, not cut-offs.
19. Hub never recommends or writes a final academic level.
20. Unknown/ambiguous/stale context fails closed.
21. No broad observer or polling is added.
22. Production integration is a separate future design/plan.

---

## 23. Review checklist for the user

Before approving G0 inspection, review whether this spec correctly captures:

- the `?` entry behavior;
- the panel hierarchy;
- the robot motion;
- Guide me vs Help me from here;
- the contextual Score Inspector;
- the strict source hierarchy;
- the separation between Hub global/native language and MS1's explicit English-first / optional `VI` assist;
- the no-auto-grade teacher-control rule;
- the 8-strand gate;
- the isolation from existing Phase 1/production behavior.

Approval of this document authorizes only the next stage: **G0 read-only DOM inspection**. It does not authorize implementation.
