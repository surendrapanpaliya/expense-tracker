# Athena SDD Overlay — expense-tracker

This directory layers athena's SDD spec governance onto the existing `expense-tracker` lab. The original `../spec.md` is the lab's product brief (language-agnostic — pick Java, Node, or Python). This overlay adds the **canonical spec layer** that athena's SDD wrapper expects: schema, template, validator, and one worked example spec at `docs/specs/features/APR-9001-add-recurring-expenses.md`.

## What's here

| Path | Source |
|---|---|
| `docs/specs/_schema.md` | **Verbatim copy** from `appointment-reminder-service/docs/specs/_schema.md`. Single source of truth for the spec contract. |
| `docs/specs/_template.md` | **Verbatim copy** from `appointment-reminder-service/docs/specs/_template.md`. Author starter. |
| `docs/specs/features/APR-9001-add-recurring-expenses.md` | **Synthesized** — example spec following athena's exact schema (5 fields, 6 sections, cross-field rules). Used by [/modules/athena-sdd/03-working-with-a-spec](/modules/athena-sdd/03-working-with-a-spec). |
| `docs/adr/0000-template.md` | **Verbatim copy** — Michael Nygard ADR template. |
| `scripts/validate_spec.js` | **Verbatim copy** — pure-Node validator, no `npm install` needed. |

## Why APR-9001 and not EXP-0001?

Athena's `validate_spec.js` hardcodes the spec ID regex as `^APR-\d{4}$` (Athenahealth Spec ID, the convention from the wrapper's reference repo `appointment-reminder-service`). This overlay reuses the validator unmodified — so teaching specs use the **9000+ ID series** to coexist with athena's pattern without code changes.

If you'd prefer a per-lab prefix, that's a one-line change in `scripts/validate_spec.js` (the `ID_PATTERN` constant). For training purposes, keeping the validator byte-identical to athena's is the cleaner story: "the validator on your laptop is the one running in athena CI."

## How module 03 uses this

The workshop reads `@docs/specs/features/APR-9001-add-recurring-expenses.md` into Claude's context, plans against it in plan mode, and verifies the spec validates with `node scripts/validate_spec.js`. The lab does **not** require a runnable expense-tracker app — the focus is the spec lifecycle, not the implementation runtime.

If the cohort wants to actually run code against the spec, the parent `../spec.md` describes a working app you can implement in the language of your choice.
