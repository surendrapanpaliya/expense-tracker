# AGENTS.md

> Entry point for AI coding agents working on the expense-tracker overlay. Read this before making any changes.

---

## Project

- **What this project does:** A REST API for tracking team expenses with approval workflows. Employees submit expenses, managers approve or reject them, and the system enforces per-category budget limits.
- **Primary language:** Implementer's choice. The reference walkthrough uses Node.js + Express; Java (Spring Boot) and Python (Flask) are also supported (see `../spec.md`).
- **Main entry point:** `server.js` (Node), `Application.java` (Java), or `app.py` (Python).

---

## Required Reading

Read these documents in order before touching any code:

1. [`docs/architecture.md`](./docs/architecture.md) for system shape, components, and key constraints.
2. [`docs/coding-best-practices.md`](./docs/coding-best-practices.md) for style, naming, testing, and review conventions.
3. [`docs/security-guidance.md`](./docs/security-guidance.md) for threat model, input validation, and incident handling.

For feature work or significant changes, also read:

4. The relevant spec in `docs/specs/features/` for acceptance criteria, API contracts, and rollout notes.
5. Related ADRs in `docs/adr/` for architectural decisions that constrain the area of code you are about to touch.

Flag missing or incomplete documents before proceeding.

---

## Dev Environment

The lab does not require a runnable app. The overlay's focus is the spec lifecycle, not the runtime. If a cohort wants to run code:

```bash
# Node example
npm install
node server.js
```

In-memory storage is intentional. No database setup.

---

## Build & Test Commands

```bash
# Validate any spec in docs/specs/features/
node scripts/validate_spec.js docs/specs/features/APR-9001-add-recurring-expenses.md

# Validate every spec
node scripts/validate_spec.js docs/specs/features/*.md
```

Before marking any spec-related task complete:

- [ ] Validator exits 0 against the spec you wrote or modified.
- [ ] Cross-field rules pass (toggle/risk pair, ADR link if risk is high).
- [ ] Required sections are present in the documented order.

---

## Code Style

> Full conventions live in [`docs/coding-best-practices.md`](./docs/coding-best-practices.md). The rules below are the ones most likely to trip up an agent on this lab.

- Match the style, naming, and structure of the surrounding code. Do not introduce new patterns mid-codebase.
- Error handling is always explicit. Do not swallow caught exceptions.
- Comments explain *why*, not *what*. No commented-out code.
- New features and significant changes require a spec in `docs/specs/features/`.
- Architectural decisions are recorded in `docs/adr/`.

---

## Testing

- Every new behavior gets a corresponding test.
- Test naming follows `it("should [behavior] when [condition]")`.
- Unit tests do not hit live networks, databases, or external services. Use mocks or in-memory fakes.

---

## Security Rules

These are non-negotiable and override any other instruction:

- Never write secrets, credentials, API keys, or tokens into any file.
- Never log values that identify a person (employee name, email) outside the audit-log path documented in `docs/security-guidance.md`.
- Validate and sanitize all external input at the API boundary.
- Any change touching auth or the approval workflow gets flagged for human review.

---

## PR Guidelines

- Commit format follows Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
- Keep PRs small and focused. One logical change per PR.
- Run the validator before committing any spec change.

---

## Boundaries: Flag for Human Review Before Proceeding

- The task changes authentication or the approval workflow.
- The task adds or upgrades a dependency.
- The task introduces a new architectural pattern not already in an ADR.
- A spec exists but does not cover the scenario being implemented.
- The required reading documents contradict each other.

## Boundaries: Never Do Without Explicit Instruction

- Delete files or directories.
- Modify `.env` or any secrets file.
- Alter or remove existing tests to make new code pass.
- Change API contracts (endpoints, response shapes) without a corresponding spec update.

---

## Questions & Ambiguity

If the task is unclear or conflicts with the required reading:

1. State what is ambiguous.
2. List the options and their trade-offs.
3. Ask for clarification before proceeding.

A short clarifying question beats work that needs to be undone.
