# _schema.md — canonical spec schema for appointment-reminder-service

This file defines the required structure of every spec in `docs/specs/features/`. CI rejects specs that don't conform. Authors copy from `_template.md` and the wrapper (`/aha-ms:propose`) populates required fields.

Conforms to Athenahealth SDD §3.5, §3.6, §3.10, §3.11.

---

## 1. Required frontmatter

Every spec MUST begin with YAML frontmatter containing exactly these five required fields:

```yaml
---
id: APR-NNNN              # See "id" rules below
risk: low|medium|high     # See "risk" rules below
owner: <string>           # Team or individual
toggle: <flag-key>|none   # LaunchDarkly flag, or `none` for low-risk cosmetic
status: draft|ready|in-progress|done|archived
---
```

A sixth optional field, `repos:`, is reserved for cross-repo features (Athenahealth SDD §3.11). Out of scope for this schema version.

### 1.1 Field rules

**`id`**
- MUST match pattern `APR-\d{4}` (e.g. `APR-0001`)
- MUST be unique within this repo
- Once assigned, never reused, even after archive

**`risk`**
- `low` — cosmetic, internal-only, no patient-visible behaviour change. Standard CI gate only.
- `medium` — externally visible behaviour change. Requires peer review on top of CI.
- `high` — affects PHI handling, payments, clinical workflows, or interoperability. Requires explicit human approval beyond peer review (Athenahealth SDD §3.6).

**`owner`**
- Non-empty string
- Convention: team name in kebab-case (e.g. `scheduling-platform-team`) or individual e-mail

**`toggle`**
- LaunchDarkly flag key, lowercase with dots and hyphens (e.g. `appointment-reminder.sms-channel.enabled`)
- MAY be the literal string `none`, but only when `risk: low` AND the change is cosmetic
- Per Athenahealth SDD Rule 4: if you think you do not need a flag, you almost certainly do

**`status`**
- Lifecycle: `draft` → `ready` → `in-progress` → `done` → `archived`
- `draft` — author working on it, not yet reviewed
- `ready` — BLSO/PO accepted, ready for implementation (Athenahealth SDD §6.5 gate)
- `in-progress` — implementation started
- `done` — implementation complete, flag at 100%, observed in production
- `archived` — moved to `docs/specs/archive/`, kept for history

---

## 2. Required body sections

Every spec MUST contain these top-level sections, in this order. The validator checks both presence and order.

### 2.1 `## Why`
Statement of the problem the spec addresses. 1–4 paragraphs.

### 2.2 `## What changes`
Behaviour delta in the form "before X, after Y". Bullet list permitted.

### 2.3 `## Capabilities`
User-facing capabilities the spec adds. References concrete actors (patient, scheduler, system).

### 2.4 `## Rollback`
What happens if the change must be reversed. MUST cover:
- LaunchDarkly disable steps (using the `toggle` field above)
- Data migration reversal, if any
- Communication — who is notified, by which channel

Specs with `toggle: none` MUST still include this section explaining how the change is reversed without a flag.

### 2.5 `## Escalation conditions`
Tells agents and humans when to stop and escalate (Athenahealth SDD §3.6 system-enforced escalation). MUST list:
- Conditions that require pausing implementation
- Who is escalated to (team or individual)
- Threshold metrics if applicable (e.g. error rate above N%)

### 2.6 `## Tests`
Test scenarios or references to test files. Athenahealth SDD Rule 3 ("tests are not optional").

---

## 3. Conformance criteria

A spec conforms when ALL of these hold:

1. Frontmatter has all five required fields with valid values
2. All six required body sections are present in the right order
3. `id` is unique within the repo
4. If `risk: high`, a corresponding ADR exists in `docs/adr/` and is linked from the spec
5. If `toggle != none`, the flag key is registered in LaunchDarkly (verified at archive time, not propose time)

---

## 4. What this schema deliberately does NOT specify

- **Implementation language, framework, library** — those are tool concerns (Athenahealth SDD §3.8)
- **Specific test framework** — JUnit/Mockito are wrapper-imposed, not schema-imposed
- **Code style and quality rules** — those live in SonarQube (Athenahealth SDD §6.6, dynamic consumption deferred per gap analysis §8.2)
- **Cross-repo coordination** — the `repos:` pointer field is reserved but out of scope for this schema version

---

## 5. Versioning

This schema version is `1.0.0`. Breaking changes require an ADR and a migration plan for existing specs.
