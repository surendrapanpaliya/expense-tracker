# Coding Best Practices

How we write code in the expense-tracker lab. For system structure and decisions, see [architecture.md](./architecture.md). For threat model and security controls, see [security-guidance.md](./security-guidance.md).

---

## General Principles

A short list of values that settle the cases the rules below do not cover.

- **Clarity over cleverness.** Code is read more often than it is written.
- **Explicit over implicit.** Make intent obvious. No magic.
- **Small, focused units.** Functions do one thing.
- **Fail loudly.** Surface errors at the boundary they happen. Do not swallow them.
- **Match the surrounding style.** Do not introduce a new pattern unless an ADR sanctions it.

---

## Code Style & Formatting

| Stack | Formatter | Linter |
|---|---|---|
| Node | Prettier | ESLint |
| Java | Spotless / google-java-format | Checkstyle |
| Python | Black | Ruff |

Style debates are settled by the formatter. If the formatter accepts it, that is the rule.

- **Line length:** 100 characters.
- **Indentation:** 2 spaces (Node, Python), 4 spaces (Java).

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Variables | camelCase (Node, Java); snake_case (Python) | `expenseAmount`, `expense_amount` |
| Constants | UPPER_SNAKE_CASE | `MAX_AMOUNT` |
| Functions / Methods | camelCase (Node, Java); snake_case (Python) | `approveExpense`, `approve_expense` |
| Classes / Types | PascalCase | `ExpenseService` |
| Files | kebab-case (Node); PascalCase (Java); snake_case (Python) | `expense-service.js` |

**Additional rules:**

- Booleans read as predicates. `isApproved`, `hasBudgetRemaining`, `canApprove`.
- Avoid abbreviations unless universally understood. `id`, `url`, `api` are fine. `expSvc` is not.
- Names reflect *what*, not *how*. `getPendingExpenses()` beats `queryStoreForExpensesWhereStatusEqualsPending()`.

---

## Project Structure

```
src/
  routes/         API handlers. Validate input, format responses.
  services/       Business rules. No I/O.
  store/          In-memory state. Single source of truth.
  audit/          Audit-log writer.
  config/         Seed data, category budget definitions.
tests/
  unit/
  integration/
```

**Rules:**

- Business rules live in `services/`, not in route handlers.
- Routes do not touch the store directly. Go through a service.
- No circular dependencies between modules.

---

## Error Handling

- Handle errors explicitly. Never silently ignore a caught exception.
- Use typed errors (or status-code-bearing errors) so callers can distinguish failure modes.
- Log with context: operation name, expense id, actor. Never log the full request body.
- Sanitize error messages before returning them to clients. Do not leak stack traces.

```js
// Good
try {
  await approveExpense(id, actor);
} catch (err) {
  logger.error("approve_expense_failed", { expenseId: id, actor: actor.id, err: err.message });
  throw new AppError("APPROVE_FAILED", { cause: err });
}

// Bad
try {
  await approveExpense(id, actor);
} catch (e) {
  // silently ignored
}
```

---

## Testing

- **What to test:** All business rules, edge cases, and validation at the API boundary.
- **What not to test:** Framework internals, generated code, trivial getters.
- **Test pyramid:** Prefer unit tests on the service layer. Use integration tests at the API boundary. Skip E2E for this lab.
- **Naming:** `it("should reject an expense when the actor is not a manager")`.
- **Isolation:** Unit tests must not hit the network or filesystem. Mock the store if you mock anything.

```js
// Good
it("should return 422 when approving an expense would exceed the category budget")

// Bad
it("test approveExpense error case")
```

---

## Comments & Documentation

- Do not comment what the code says. Comment *why* it does something non-obvious.
- TODO format: `// TODO(yourname): description` with a ticket link if one exists.
- Do not commit commented-out code. Use version control.

```js
// Good. Explains why.
// Budget checks run on approval, not submission, so an over-budget submission can sit pending until a manager rejects it explicitly.
if (newSpent > limit) return reject(422, "BUDGET_EXCEEDED");

// Bad. Restates the code.
// If new spent is over limit, reject with 422.
if (newSpent > limit) return reject(422, "BUDGET_EXCEEDED");
```

---

## Git & Version Control

- **Branch naming:** `feat/`, `fix/`, `chore/`, `docs/` prefixes. `feat/add-recurring-expenses`.
- **Commit messages:** Conventional Commits. `feat:`, `fix:`, `chore:`, `docs:`, `test:`.
- **Commit size:** Each commit is one logical change.
- **Pull requests:** Require at least one approval and a green CI run before merge.
- **No force-pushing** to `main` or `develop`.

---

## Dependencies

- Adding a dependency requires team discussion for anything non-trivial. Prefer well-maintained packages with small footprints.
- Pin exact versions in production. Use ranges only in libraries.
- Audit regularly. `npm audit`, `pip-audit`, or equivalent runs in CI.
- Remove unused dependencies. Do not leave dead entries in the manifest.

---

## Security Practices

Full requirements live in [security-guidance.md](./security-guidance.md). The rules below are coding-level reminders.

- Never commit secrets. Use environment variables or the secrets manager named in [security-guidance.md](./security-guidance.md).
- Validate all input at the API boundary. Prefer allowlists over denylists.
- No string interpolation in queries. (This lab has no SQL; if you add one in your hackathon, parameterize it.)
- Logging never captures employee name in non-audit code paths.

---

## Performance Guidelines

- Profile before optimizing. Do not guess at bottlenecks.
- Avoid N+1 access patterns over the store. Batch lookups when iterating.
- Set timeouts on any outbound call you add.
- Paginate any endpoint that could return an unbounded list.

---

## Code Review Etiquette

- **Reviewers:** Focus on correctness, clarity, and consistency. Style is the linter's job.
- **Authors:** Keep PRs small. Provide context in the PR description.
- **Nitpicks:** Prefix with `nit:` so the author knows they are optional.
- **Blocking vs non-blocking:** Be explicit about whether a comment must be addressed before merge.
- **Approving** means you have read it and would be comfortable maintaining it.

---

## References

- [architecture.md](./architecture.md)
- [security-guidance.md](./security-guidance.md)
- [Conventional Commits](https://www.conventionalcommits.org/)
