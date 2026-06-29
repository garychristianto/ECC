---
type: convention
id: verse-ref-validation
domain: alkitab
status: draft
enforced_by: ci/verse-ref-validation
---

# Convention: verse references must validate before render

## Rule

Any code path that renders or links a scripture reference MUST validate it against
`bible-facts/verse-ref-format.md` first, and **fail closed** on a malformed
reference (show a graceful fallback, never crash, never render a dead link).

## Why this exists

This is a reusable oracle, not a one-off ticket rule. The retro promotes recurring
leak classes here so future tickets inherit the check instead of re-specifying it.
Seeded from the "null verse-ref crash" leak class.

## How it's enforced

- A CI/gate check `verse-ref-validation` runs the oracle over changed render paths.
- The retro's dead-check audit watches this: if it fails zero times over many runs
  AND no related leaks recur, it becomes a candidate to downgrade.

## Amendment trail

- Added by: decision 0001 (seed). Future `okf/retro/*/A-*.md` amendments that touch
  this convention link back here via `target: convention/verse-ref-validation`.
