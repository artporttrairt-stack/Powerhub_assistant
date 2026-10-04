# Hub Assistant

Hub Assistant is the modular successor to the legacy **PowerSchool Quick Message 1.8.13** repository layout.

The current development baseline is:

- **8J-R2 LIVE PASS** PowerHub runtime;
- **Hub Assistant manifest 1.9.7 / 1.9.7-robot-first.1**;
- **Teacher Support Phase 0**: an isolated, fail-closed PowerTeacher foundation with no visible Teacher Support UI or automated teacher actions yet.

PowerSchool remains the source of truth. Phase 0 does not auto-click, grade, fill, save, publish, send, or infer academic decisions.

## Repository layout

- `extension/` — **current development source tree**.
- `tests/phase0/` — Phase 0 regression, privacy, host-boundary, lifecycle, and side-effect gates.
- `scripts/verify-phase0.mjs` — full Phase 0 verifier.
- `docs/teacher-support/` — Teacher Support architecture/source contracts.
- `documentation/` — store/privacy/safeguarding documentation for the frozen release candidate.
- `verification/` — 8J-R2 and release provenance/checksum evidence.
- `packages/Hub_Assistant_STORE_PACKAGE.zip` — **frozen pre-Phase-0 store release candidate**.

## Source vs. Store ZIP provenance

Do **not** assume that `extension/` and `packages/Hub_Assistant_STORE_PACKAGE.zip` are the same build.

| Artifact | Purpose | Provenance |
| --- | --- | --- |
| `extension/` | Current development source | 8J-R2 LIVE PASS + Teacher Support Phase 0 |
| `packages/Hub_Assistant_STORE_PACKAGE.zip` | Frozen store-oriented release candidate | 8J-R2 LIVE PASS **before** Teacher Support Phase 0 |
| `RELEASE_README.md` | Frozen release-candidate provenance | Task 8L / 8J-R2 |
| `verification/STORE_PACKAGE_SHA256.txt` | Frozen Store ZIP checksum | SHA-256 evidence for the pre-Phase-0 package |

Frozen Store ZIP SHA-256:

```text
e66fba658fa20921c40980e162c0b6ed44fd1717f344ec65706f45cc8b0269b6
```

The current `extension/manifest.json` includes the Phase 0 PowerTeacher boundary. The frozen Store ZIP was intentionally **not rebuilt** during Phase 0, because Phase 0 is a development checkpoint rather than a store release.

Both artifacts may still report manifest version `1.9.7`; that shared version number does **not** mean their runtime trees are byte-identical.

For Phase 0 development, review, and testing, use **`extension/`** as the source tree. Do not use the frozen Store ZIP as proof of the current Phase 0 source.

A future public-store release must be produced as a separate release task with an appropriate version decision, fresh packaging, checksum generation, privacy/store-metadata review, and full regression verification.

## Verification

From the repository root:

```bash
npm run verify:phase0
```

The verifier covers protected 8J-R2 runtime integrity, PowerTeacher host isolation, sanitized context, fail-closed CAM Primary MS1 applicability, dormant lifecycle behavior, teacher-control/static side-effect gates, CI configuration, and JavaScript syntax.

GitHub Actions job:

```text
verify-phase0
```

This check is intended to be required on protected integration branches.

## Teacher Support Phase 0 boundary

Phase 0 intentionally contains **foundation only**:

- exact PowerTeacher host/path boundary;
- sanitized PowerTeacher route context;
- pluggable guidance-pack registry;
- CAM Primary · MS1 applicability/source identity contract;
- dormant lifecycle with no implicit observer/timer/listener/UI mounting;
- no Bubble Deck, robot UI, rubric rendering, PowerTeacher DOM automation, or consequential native actions.

See:

- `docs/superpowers/plans/2026-10-03-teacher-support-phase-0.md`
- `docs/teacher-support/BASELINE_EXPANSION_READINESS_AUDIT_2026-10-03.md`
- `docs/teacher-support/SOURCE_CONTRACT.md`

## Release status

The repository source is a **development baseline**, not a declaration that the frozen Store ZIP is the latest development build.

For the frozen 8J-R2 release-candidate details, read `RELEASE_README.md`.
