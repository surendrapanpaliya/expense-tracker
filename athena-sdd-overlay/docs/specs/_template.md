<!--
Spec starter template for appointment-reminder-service.

Usage:
  1. Copy this file to docs/specs/features/APR-NNNN-<slug>.md
  2. Replace every <angle-bracket> placeholder with real content
  3. Replace APR-NNNN in frontmatter with the next free ID

The /aha-ms:propose wrapper does steps 1-3 automatically. Manual copy is also fine.

This template itself is NOT a real spec. The schema validator (scripts/validate_spec.js)
intentionally skips _template.md and only validates files in docs/specs/features/.
-->
---
id: APR-NNNN
risk: low
owner: <team-name-or-email>
toggle: none
status: draft
---

# <Spec Title>

## Why

<1-4 paragraphs explaining the problem this spec addresses. What is broken or missing today? Why does fixing it matter? What does success look like?>

## What changes

<Behaviour delta in before/after form. Bullet list permitted.>

- Before: <current behaviour>
- After: <new behaviour>

## Capabilities

<User-facing capabilities the spec adds. Reference concrete actors.>

- As a <actor — patient, scheduler, system, etc.>, I can <do thing> so that <outcome>.

## Rollback

<How is this change reversed if it must be undone? At least one of: flag-disable, data-migration-reversal, comms.>

- LaunchDarkly: disable `<toggle key from frontmatter>` — traffic falls back to <prior behaviour>.
- Data: <migration reversal steps, or "No data migrations.">
- Communication: <who is notified, by which channel>

If `toggle: none`, replace the LaunchDarkly bullet with: "No flag — change is reversed by <revert mechanism>."

## Escalation conditions

<When should the agent or human implementer stop and escalate? At least one condition, one contact, and a threshold if measurable.>

- Pause and escalate if: <condition>
- Escalate to: <team or individual>
- Threshold (if measurable): <e.g. error rate > 1% over 10 minutes>

## Tests

<Test scenarios or references to test files. Tests are not optional (Athenahealth SDD Rule 3).>

- <Scenario 1: input → expected behaviour>
- <Scenario 2>
- See: <path/to/test/file or test class>
