---
id: APR-9001
risk: medium
owner: expense-tracker-team
toggle: expense-tracker.recurring-expenses.enabled
status: ready
---

# Add recurring expenses

## Why

Users currently have to enter rent, utilities, and subscriptions every month by hand. The expense list shows the cost of that friction: ~22% of expenses are clearly recurring (same payee, same amount, monthly cadence) and account for 38% of total expense volume. Skipping them creates audit gaps when month-end reports are reconciled against the source bank statement.

Adding recurring expenses removes the manual re-entry, closes the audit gap, and reduces the per-month bookkeeping window for a typical user from ~25 minutes to under 5.

## What changes

- Before: every expense is a one-time row entered manually for each month.
- After: a recurring expense template generates child expense rows on the configured cadence; users review and approve each generated row before it posts to the ledger.

- New endpoint `POST /recurring-expenses` accepts `{name, amount, category, cadence, dayOfMonth, startDate, endDate?}`.
- Modified endpoint `GET /expenses` includes generated child rows in the result; child rows carry a `recurringTemplateId` field.
- New endpoint `POST /recurring-expenses/{id}/generate` materializes the next due child row for review.
- Generated child rows default to `status: pending` (existing convention) and require explicit user approval before posting.

## Capabilities

- As a user, I can create a recurring expense template with a monthly or weekly cadence so that the system generates the per-period rows for me.
- As a user, I can review and approve each generated child row before it posts so that nothing lands in my ledger without my eyes on it.
- As a user, I can pause or end a recurring expense template so that the system stops generating new child rows from a chosen date forward.
- As an auditor, I can trace each posted child row back to the recurring template that generated it so that month-over-month variance is explainable.

## Rollback

- LaunchDarkly: disable `expense-tracker.recurring-expenses.enabled` — both new endpoints return 404 and `GET /expenses` stops including the `recurringTemplateId` field. Already-generated child rows remain in the ledger as ordinary expenses (they are real ledger entries the user approved).
- Data: no schema migration to reverse. The `recurring_templates` table remains but is unread when the flag is off; new template rows cannot be created. Existing child rows in the `expenses` table are valid expense records and require no cleanup.
- Communication: notify expense-tracker-team Slack and the on-call SRE before disabling. Users with active templates see the recurring section disappear from the UI; an in-app banner explains the pause and points to manual entry.

## Escalation conditions

- Pause and escalate if: any user's `GET /expenses` latency exceeds 800ms p95 over a 10-minute window after rollout, OR the rate of duplicate child rows (same `recurringTemplateId` + same period) exceeds 0.5%.
- Escalate to: expense-tracker-team on-call SRE.
- Threshold (measurable): error rate on `POST /recurring-expenses` > 1% over 10 minutes triggers automatic flag disable via the LD kill-switch.

## Tests

- Scenario 1: Creating a monthly template with `dayOfMonth: 15` and `startDate: 2026-05-15` generates a child row dated `2026-05-15`, then `2026-06-15`, with `status: pending` on each.
- Scenario 2: Generating a child row when a `recurringTemplateId` + period combination already exists returns 409 (no duplicate).
- Scenario 3: Disabling the LD flag mid-session returns 404 from `POST /recurring-expenses/{id}/generate` for the rest of the session — already-approved child rows remain queryable through `GET /expenses` without the `recurringTemplateId` field.
- Scenario 4: Setting `endDate` on an active template stops further generation from that date forward; child rows with periods after `endDate` are not created.
- See: `tests/recurring_expenses_test.<ext>` (path depends on chosen implementation language; lab is language-flexible).
