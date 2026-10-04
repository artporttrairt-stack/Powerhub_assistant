# PowerTeacher Stage 2 UI Contract

## Purpose

This contract freezes only the PowerTeacher UI facts supported by the Stage 2A G0 sanitized, read-only evidence. It is a platform contract, not workflow business logic. Unknown or ambiguous native state must fail closed.

Evidence classifications used by this contract:

- `LIVE_READ_ONLY_VERIFIED` — observed in sanitized live DOM/read-only probes.
- `HELP_VERIFIED` — semantics verified from official PowerTeacher Help.
- `UNVERIFIED` — not safe to depend on; critical `UNVERIFIED` items block support behavior.

Task 1 uses only `LIVE_READ_ONLY_VERIFIED` facts. No selector below is inferred from naming alone.

## Verified contract

| Item | Contract | Evidence |
| --- | --- | --- |
| Grading navigation | `#sidebar-charms-grading` | `LIVE_READ_ONLY_VERIFIED` |
| Standards navigation | `#grading-standards-link` | `LIVE_READ_ONLY_VERIFIED` |
| Active Standards view | Grading active AND `#section-mega-menu` has Standards semantics AND `#standard-final-grades` is computed-visible | `LIVE_READ_ONLY_VERIFIED` |
| Standards page Gear / Special Functions | `#special-functions` | `LIVE_READ_ONLY_VERIFIED` |
| Show/Hide Filter | one dynamic toggle: `#hide-filter`; interpret `Show Filter` / `Hide Filter` semantics, never the ID name | `LIVE_READ_ONLY_VERIFIED` |
| Standards filter input | `#simple-search-standard-final-grades`; computed visibility is state truth; presence alone is insufficient | `LIVE_READ_ONLY_VERIFIED` |
| MS1 result marker | scope `#standard-final-grades`; candidates `th.standard-column-header.standard-col`; require **all 8 MS1 strands** as distinct semantic groups. Each group may match its canonical identifier (for example `MS1-Academic`) or its source-backed official display alias (for example `MS1 - Academic Achievement`). Generic `MS1` text, TA Grade, Ranking, or a partial strand set is insufficient. | `LIVE_READ_ONLY_VERIFIED` selector/state + source-backed semantic aliases |
| Hub mount host | one extension-owned direct child of empirically stable `document.body`; host stability only, insertion still needs implementation smoke | `LIVE_READ_ONLY_VERIFIED` |
| Section/route signals | `hashchange` and `popstate`; invalidate stale context and re-resolve; never persist raw section IDs | `LIVE_READ_ONLY_VERIFIED` |

Route family `#/classes/final_grades` may be a supporting signal but is never sufficient by itself to prove the active Standards context.

### MS1 semantic gate

The eight canonical strand identifiers are:

- `MS1-Academic`
- `MS1-Attitude`
- `MS1-Behaviour`
- `MS1-Classwork`
- `MS1-Communication`
- `MS1-Collaboratively`
- `MS1-Creativity`
- `MS1-Equipment`

The adapter normalizes whitespace and punctuation and may accept the corresponding official display names from sanitized standards metadata. It still requires one match for every canonical group. **MS1 text alone is insufficient.**

This deliberately rejects look-alike MS1 columns such as TA Grade or Ranking and rejects partial strand visibility. The rubric opens only after the complete eight-strand context is visible.

## Filter-first behavior

1. Verify Standards context using the composite contract above.
2. Read computed visibility of `#simple-search-standard-final-grades`.
3. If visible, the filter is already open; skip Gear / Show Filter guidance.
4. If not visible, highlight `#special-functions`; the teacher manually opens it.
5. Then highlight/describe `#hide-filter` only when its semantics represent `Show Filter`.
6. Re-read the DOM after the teacher action.

The Hub does not click native PowerTeacher controls.

## Teacher-control safety

`Show me = highlight only`.

Never automate grading, Fill, Save, Publish, Send, comment writes, flag toggles, Undo/revert, Recalculate Final Grades, Revert Grades to Calculated, Standards Gear, Show/Hide Filter, Apply/Clear, or any synthetic native action.

## Explicitly rejected assumptions

Do not use any of the following as state truth or primary identity:

- `#filter-standards` — absent from the verified live render.
- `#show-filter` — no reliable separate element; `#hide-filter` is the verified dynamic toggle.
- `.filter-bar.collapsed` — class name did not match computed visibility.
- `#sidebar-charms-settings` — global/sidebar Settings, not the Standards page Gear.
- numeric standard-* IDs — dynamic identity.
- `standard-color-*` — presentation only, not identity.
- native Angular child containers such as `#standard-final-grades`, grid/widget/form containers, `#content-main`, `#container-main`, or `#sidebar-charms-container` as Hub ownership roots.
- route family alone as proof of current section.
- early generic MS1 zero-count captures as proof of no results.

## Runtime consumption rule

`extension/src/platform/powerteacher/teacher-ui-contract.js` is the machine-readable copy of this contract. Its evaluator returns `ready:false` when any critical item is `UNVERIFIED`, missing, or lacks required contract fields. Downstream adapters must not compensate by guessing a selector.

## Source trace

Primary execution authority for this Task 1 contract:

- `HANDOFF_STAGE2A_G0_2026-10-04.md`, sections 5–11.
- `EVIDENCE/G0_SANITIZED_EXPORT_11_CAPTURES.txt` plus the supplementary read-only probes summarized in the handoff.
- `2026-10-04-stage2a-platform-setup-ms1-guidance-plan.md`, Task 1.
- `AGENTS_STAGE2.md`, platform verification, privacy, performance, and teacher-control locks.

No raw section IDs, student identifiers, teacher identifiers, auth values, tokens, cookies, grades, or SIS payloads belong in this contract.
