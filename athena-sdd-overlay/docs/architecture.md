# Architecture

The expense-tracker is a single-process REST API for submitting and approving team expenses. Employees create expense records; managers approve or reject them; the service enforces per-category monthly budget caps. It runs in-memory for training purposes. There is no database, no message bus, and no external integration.

This document captures the shape of the system. For code conventions, see [coding-best-practices.md](./coding-best-practices.md). For threat model and input validation, see [security-guidance.md](./security-guidance.md).

---

## System Context

- **Users:** Employees submitting expenses; managers reviewing them. Both interact through the REST API. No frontend ships with this lab.
- **External services:** None. The service is self-contained.
- **Upstream / downstream systems:** None for the lab. A production system would feed into payroll or accounting; that scope is out of this app.

---

## High-Level Architecture

```
[ Client ]  -->  [ HTTP API ]  -->  [ Service Layer ]  -->  [ In-Memory Store ]
                                          |
                                          +-->  [ Budget Enforcement ]
                                          +-->  [ Audit Log ]
```

| Layer | Technology | Responsibility |
|---|---|---|
| HTTP API | Express / Spring / Flask | Route requests, validate input, format responses |
| Service Layer | Plain language code | Business rules: submission, approval, budget checks |
| In-Memory Store | Map or list | Holds expenses and audit entries for the process lifetime |
| Audit Log | In-memory list | Records every state change for traceability |

---

## Component Breakdown

### HTTP API
- **Responsibility:** Accept and validate requests; produce JSON responses.
- **Key interfaces:** `POST /expenses`, `GET /expenses`, `POST /expenses/:id/approve`, `POST /expenses/:id/reject`, `GET /budgets`.
- **Notes:** All input validation happens here. Service-layer functions assume input is already shaped.

### Service Layer
- **Responsibility:** Apply business rules. Approval requires manager role; approving an expense decrements the available budget for its category; rejecting an expense leaves the budget untouched.
- **Notes:** No I/O. Pure transformations against the in-memory store.

### In-Memory Store
- **Responsibility:** Hold expenses keyed by id; hold per-category running totals; hold audit log entries.
- **Notes:** Reset on process restart. Seed data loads on startup.

---

## Data Flow

### Primary Flow: Submit and Approve an Expense

1. Employee `POST /expenses` with description, amount, category.
2. API validates input shape, range, and category enum.
3. Service layer creates an `Expense` with status `pending` and an audit-log entry.
4. Manager `POST /expenses/:id/approve`.
5. Service layer checks the per-category budget. If the approval would exceed the cap, return 422.
6. Otherwise mark `approved`, decrement the budget, append an audit-log entry.

### Secondary Flow: Reject

1. Manager `POST /expenses/:id/reject`.
2. Service layer marks the expense `rejected`. Budget is not touched.
3. Audit-log entry is appended.

---

## Data Model

| Entity | Description | Storage |
|---|---|---|
| Expense | A submission with id, description, amount, category, submittedBy, status, submittedAt, reviewedBy | In-memory map |
| CategoryBudget | Monthly limit per category, plus running spent total | In-memory map |
| AuditEntry | Timestamp, actor, action, expense id, before / after status | In-memory list |

**Key relationships:** Every approval transition writes one `AuditEntry`. Every category in `CategoryBudget` matches an enum value used by `Expense.category`.

---

## Infrastructure & Deployment

- **Hosting:** Local lab. No deployment pipeline.
- **Environments:** One: the developer's laptop.
- **CI/CD:** None.
- **Observability:** Console logs only.

Production positioning is intentionally out of scope. The lab teaches the spec-to-implementation lifecycle, not deployment.

---

## Security

- **Authentication:** None for the lab. A production version would use an organization SSO provider.
- **Authorization:** Role check is enforced in the service layer (`role: manager` required for approve / reject). Roles are read from a header in the lab; this is not a real security boundary.
- **Network boundaries:** Local process only.
- **Data handling:** Employee name and expense description are the only person-identifying fields. Treat them as confidential in audit-log output (see [security-guidance.md](./security-guidance.md)).

---

## Key Decisions & Trade-offs

Significant decisions are captured as ADRs in `../adr/`. List them here as a summary index when they exist.

| ADR | Title | Status | Date |
|---|---|---|---|
| (none yet) | | | |

---

## Known Limitations & Future Work

- **Current limitations:** No persistence, no real auth, no concurrency control. Restarting the process loses all data.
- **Planned improvements:** Out of scope for the lab. Discuss in your hackathon track if you want to extend it.
- **Out of scope:** Real database, real auth, payroll integration, multi-tenant separation.

---

## References

- [coding-best-practices.md](./coding-best-practices.md)
- [security-guidance.md](./security-guidance.md)
- [ADR index](../adr/)
- Product spec: [../../spec.md](../../spec.md)
