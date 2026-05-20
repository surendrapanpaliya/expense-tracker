# Security Guidance

Security requirements and controls for the expense-tracker lab. For where security fits into the system design, see [architecture.md](./architecture.md). For coding-level reminders, see [coding-best-practices.md](./coding-best-practices.md).

> This is a training lab. The data is synthetic. The controls below are intentionally simplified versions of what a production service would carry. Adopt the shape, not the calibration.

---

## Scope & Objectives

- **What this covers:** The single in-memory expense-tracker service and its API.
- **What this does not cover:** Real authentication providers, persistent storage, deployment pipelines. None of those exist in the lab.
- **Key objectives:** Integrity of the approval workflow and the audit log. Confidentiality of employee identifiers in logs outside the audit path.
- **Compliance requirements:** None in the lab. A production version inside a regulated environment would inherit the surrounding organization's policy.

---

## Threat Model

### Assets

| Asset | Sensitivity | Notes |
|---|---|---|
| Approval state | High | A successful tamper changes who got paid. |
| Audit log | High | Tamper or loss removes the trail of who approved what. |
| Employee names | Medium | Appear on expense submissions and audit entries. |
| Budget data | Low | Static seed values for the lab. |

### Threat Actors

| Actor | Motivation | Likely Attack Vector |
|---|---|---|
| Malicious submitter | Reimbursement fraud | Forged headers, oversized amounts, category bypass |
| Unauthorized approver | Self-approval, collusion | Missing role check, replayed request |
| Compromised dependency | Generic supply chain | Indirect package hijack |

### Key Risks

- [ ] Approval endpoint reachable without a manager role check.
- [ ] Input validation missing on amount, category, or description length.
- [ ] Employee identifiers leaking into non-audit log paths.
- [ ] Audit-log writes failing silently.
- [ ] Budget arithmetic vulnerable to race conditions if persistence is added later.

---

## Authentication & Authorization

### Authentication

- **Lab mechanism:** A `X-User-Id` and `X-User-Role` header pair. This is **not** a real security boundary. A production version uses the organization's SSO provider.
- **Headers are trusted only in the lab.** Document this assumption in any hackathon extension that introduces real users.

### Authorization

- **Model:** Role-based. Two roles: `employee` and `manager`.
- **Enforcement point:** Service layer, not route handler. The service rejects approve / reject calls when the actor is not a manager.
- **Self-approval:** A manager can approve only expenses they did not submit. The service checks `submittedBy != reviewer`.

---

## Secrets Management

The lab has no secrets. If a hackathon track introduces one (an external API key, a database password), follow these rules:

- Never hardcode the value in source.
- Read from an environment variable injected at runtime.
- Never log the value, full or partial.
- Add the source file to `.gitignore` if you stage local secrets for development.

---

## Data Security

### Classification

| Level | Definition | Examples in the lab |
|---|---|---|
| Public | Safe to expose externally | Category list, budget caps |
| Internal | For training participants only | Seed expenses |
| Confidential | Sensitive in a production analog | Employee name, expense description |
| Critical | Breach would cause harm | None in the lab |

### Encryption

- The lab is in-memory and local. No encryption applies.
- A production version uses TLS in transit and encryption at rest. Adopt those defaults in any extension you build.

### Logging & Person-Identifying Fields

- Application logs use opaque ids (`expenseId`, `actorId`) only.
- The audit log records person-identifying fields (employee name, manager name, timestamps) by design. That is the audit log's job.
- Do not duplicate audit-log content into application logs.

---

## Input Validation & Output Encoding

- All external input is validated at the API boundary. Type, length, format, and range checks.
- Allowlists over denylists. Category is an enum. Amount is a positive number with at most two decimal places.
- Reject oversized bodies. Cap request body size at 16 KB.
- Output is JSON only. No HTML rendering, so XSS controls are not in scope for the lab.

---

## Dependency Security

- Run `npm audit` (or stack equivalent) before adding a dependency.
- Pin exact versions in the lock file.
- Treat any direct CVE finding above `medium` as a blocker for the lab demonstration.

---

## Security Testing

| Test Type | Tool / Method | Frequency |
|---|---|---|
| Unit tests on authorization | Per-stack test runner | Every change |
| Static analysis | Stack-appropriate (ESLint security plugin, Bandit, Spotbugs) | Per PR |
| Dependency scanning | `npm audit` / `pip-audit` | Per PR |

---

## Security in the Development Lifecycle

- Every PR that touches the approval workflow or input validation requires a second pair of eyes.
- Security checklist for PRs:
  - [ ] No secrets or credentials in code.
  - [ ] All new inputs validated at the API boundary.
  - [ ] No new logging of employee identifiers in non-audit paths.
  - [ ] Authorization check present on every state-changing endpoint.
- Threat-model any new feature that introduces auth changes or a new data type. Capture the result as an ADR.

---

## Incident Response

### Severity Levels

| Level | Definition | Response in the lab |
|---|---|---|
| P0 | Active tamper of approval state | Stop the demo. Document what changed. |
| P1 | Vulnerability found mid-session | Open an issue. Continue if the workflow is unaffected. |
| P2 | Low-risk finding | Note in the post-mortem. |

The lab has no on-call. In production, the surrounding organization's incident process applies.

---

## Compliance & Audit

The lab has no formal compliance scope. If a hackathon track lands the service inside a regulated context, list the relevant requirements here and assign owners.

---

## References

- [architecture.md](./architecture.md)
- [coding-best-practices.md](./coding-best-practices.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
