# Hub Assistant Expanded 1.9.24

This branch synchronizes the exact latest uploaded Chromium release payload:
`Hub_Assistant_1.9.24_EDGE_ADDONS_TEXT_ONLY_CERT_READY.zip` (uploaded 2026-10-01).
Version and version_name: **1.9.24**. No runtime refactor was performed.

See [HANDOFF_CURRENT.md](HANDOFF_CURRENT.md) for provenance, validation, continuation and rollback.
Load this repository root as an unpacked extension in Chrome/Edge. The root manifest loads `src/` and `sis/`; obsolete 1.8.13 root runtime files have been removed.

Run `python3 handoff/verify_baseline.py` from the repository root. It verifies all 74 package files against SHA-256, checks manifest references, parses JavaScript, and runs three supplied Node regression suites.

Original inspection documents under `docs/` and `inspection/`, the DOCX report and inspection utilities remain historical evidence. They are not current release instructions. The former README is preserved at `docs/baseline-1.9.24/README-1.8.13-historical.md`.

Use an explicit package file list from `docs/baseline-1.9.24/SYNC_INVENTORY.json` for future store builds. Do not ZIP the entire repository, which also contains development/historical material.
