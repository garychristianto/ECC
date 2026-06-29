---
type: decision
id: 0001-stack-shape
domain: alkitab
status: accepted
date: 2026-06-29
---

# 0001 — Stack shape: Hermes harness, ECC capability, OKF knowledge

## Context

We evaluated centering the stack on Mandor. Conclusion from the design sessions:
Mandor's gate is essentially CI; its dispatch is better served by proven ECC
skills; its one non-commodity asset is the **retro**. We do not center Mandor.

## Decision

Three layers, three concerns:

- **Harness (runtime):** Hermes runs the loop, spawns ephemeral agents, holds
  workspace memory and cron.
- **Capability:** ECC skills/agents — lean global core + per-repo overlay.
- **Knowledge:** OKF bundles — `bible-facts` (domain), `conventions` (reusable
  oracles), `decisions` (this), `retro` (auto-written findings).

The retro is extracted standalone (`scripts/retro/collect.js` + `skills/retro`)
and runs over git + CI without Mandor's gate apparatus.

## Consequences

- Agents are ephemeral and remember nothing; continuity lives in OKF + workspace.
- Global skill core stays small (~14) — every Hermes task pays for its descriptions.
- The retro feeds `okf/conventions` and `okf/decisions` over time, so the oracle
  cost amortizes instead of being re-paid per run.

## This file is also the template

Copy this frontmatter shape for every new decision. `type: decision`, an `id`,
a `status`, and the four sections. This bundle is the team's semantic memory —
the answer to "what did we decide last sprint" that no ephemeral agent can hold.
