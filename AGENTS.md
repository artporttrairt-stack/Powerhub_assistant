# AGENTS.md

## Purpose
These instructions guide Codex when working in this repository.

Default mindset:

> Think first. Keep it simple. Make surgical changes. Define success clearly. Verify before claiming completion.

## 1. Understand Before Editing
- Read the request carefully before changing code.
- Inspect the relevant files, callers, dependencies, and surrounding patterns first.
- Identify the root cause instead of patching symptoms.
- Reuse the repository's existing architecture, conventions, and abstractions whenever possible.
- For multi-step work, form a short implementation plan before editing.
- If an ambiguity can be resolved safely from the repository, resolve it by inspection rather than guessing.
- If a decision is genuinely blocked by missing information and could materially change behavior, state the assumption or ask for clarification.

## 2. Keep the Solution Simple
- Write the smallest amount of code that fully solves the requested problem.
- Do not introduce a new abstraction, helper, class, package, or dependency unless it provides clear value for the current task.
- Do not refactor unrelated code just because it could be cleaner.
- Prefer code that is easy to read, test, debug, and maintain.
- Avoid speculative future-proofing for requirements that do not exist yet.

## 3. Make Surgical Changes
- Touch only the files and code paths needed for the task.
- Keep diffs focused and minimal.
- Do not rename, reformat, reorder, or reorganize unrelated code.
- Do not rewrite a working module when a localized fix is sufficient.
- Preserve existing behavior unless the requested change explicitly requires altering it.
- Before changing shared code, inspect likely callers and side effects.

## 4. Define Success Before Coding
For each task, identify a concrete success condition before implementation.

Examples:
- A reported bug can no longer be reproduced.
- A requested UI state appears under the specified conditions.
- A function returns the expected value for the failing case.
- Existing tests continue to pass.
- A new regression test fails before the fix and passes after it.

Do not treat code changes alone as proof of completion.

## 5. Bug-Fix Workflow
When fixing a bug:
1. Reproduce the failure or trace the exact failing flow.
2. Determine the root cause.
3. Choose the smallest change that addresses that cause.
4. Implement the fix in the most local appropriate place.
5. Add or update a regression test when practical.
6. Run relevant tests, lint, type checks, or build commands.
7. Check that nearby existing behavior still works.
8. Report: root cause -> change -> verification.

## 6. Feature Workflow
When adding a feature:
- Follow existing repository patterns before creating new ones.
- Stay strictly within the requested scope.
- Prefer extending an existing component or flow over creating a parallel system.
- Avoid adding optional behavior that was not requested.
- If several valid implementations exist, prefer the least complex one that satisfies the requirement.

## 7. Repository and Git Safety
- Inspect the working tree before making broad changes.
- Never discard user changes that are unrelated to the task.
- Do not use destructive Git commands such as `git reset --hard`, forced checkout, or mass deletion unless explicitly requested.
- Do not amend, rebase, force-push, or create commits unless the user explicitly asks.
- Do not silently modify generated files unless the repository's normal workflow requires it.
- Do not edit secrets, credentials, environment files, or production configuration unless the task specifically requires it.

## 8. Dependencies and Architecture
Do not add a dependency, change a public API, modify a schema, or perform a large architectural rewrite unless the task requires it.

Before doing so:
- Confirm there is no suitable existing dependency or pattern.
- Understand migration/backward-compatibility impact.
- Keep the change scoped to the requirement.
- Explain the reason in the final summary.

## 9. Testing and Verification
After editing, run the narrowest relevant verification first, then broader checks when appropriate.

Typical order:
1. Targeted unit/integration test for the changed behavior.
2. Relevant test suite.
3. Lint/type-check/static analysis.
4. Build or packaging step if the change can affect it.

Rules:
- Do not claim a test passed unless it was actually run.
- If a command cannot run, state why.
- If no automated test exists, perform the best practical manual/static verification and describe it.
- When fixing a regression, prefer a test that proves the old failure case is covered.

## 10. Avoid Unnecessary Work
Unless explicitly requested, do not:
- Reformat entire files.
- Rename unrelated symbols.
- Upgrade dependencies.
- Change package managers or build systems.
- Rewrite comments or documentation unrelated to the change.
- Optimize code without evidence that optimization is needed.
- Replace working patterns with personal preferences.

## 11. When Information Is Uncertain
Prefer repository evidence over assumptions.

Inspect:
- Existing implementations.
- Tests.
- Types/interfaces.
- Configuration.
- Call sites.
- Documentation and comments.
- Version/package metadata.

Ask for clarification only when the missing information materially blocks a correct implementation and cannot reasonably be inferred from the repository.

## 12. Final Response Format
Keep the final response concise and evidence-based.

Use this structure when relevant:

- **Changed:** what was modified.
- **Why:** the root cause or requested goal.
- **Files:** files actually changed.
- **Verified:** tests/build/lint/manual checks actually performed.
- **Remaining:** only unresolved limitations, risks, or follow-up items.

Do not say "fixed", "done", or "working" without verification evidence.

## Core Rule

> Inspect first. Solve the root cause. Change as little as possible. Preserve unrelated behavior. Verify the result.
