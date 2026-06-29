---
name: retro
description: Standalone run retrospective. Turns a run's deterministic evidence (git + CI) into cited findings and proposed harness amendments, written to an OKF knowledge bundle for human approval. Use at a sprint/run boundary, after a batch of merged PRs, or on a cron, to make the harness improve itself instead of repeating mistakes.
metadata:
  origin: ECC
---

# Retro

Produce an evidence-cited retrospective at a run boundary. The retro is the one
genuinely self-improving step in an agent pipeline: it does not fix a diff, it
fixes the *system that judged the diff*. Extracted from Mandor's retrospective so
it runs over plain git + CI without any gate apparatus.

## When to Activate

- End of a sprint, milestone, or batch of merged PRs
- After a run of automated work (e.g. a Mandor or dispatch-agent run)
- On a schedule (Hermes cron) to keep the harness from accumulating dead checks
- The user says "retro", "what did we learn", "audit the run", "what leaked"

## Inherited Principles (do not violate)

1. **Code collects, model judges.** Read only the collector's `evidence.json`.
   Never invent evidence or cite a commit/PR/issue that is not in it.
2. **Cite-or-drop.** Every finding MUST carry a resolvable `ref` (SHA / PR# /
   run URL / issue#). No reference → it is an opinion → drop it or mark
   `confidence: low` and label it unverified.
3. **Two-way audit.** Every amendment is either an **add** (something leaked and
   no check caught it) or a **delete** (a check that never fires / is redundant).
   Add-only is how check suites rot.
4. **Retro proposes, human disposes.** Never edit CI, skills, or gates directly.
   Amendments land as files with `status: proposed` plus a review PR.

## How It Works

```
[run boundary] → scripts/retro/collect.js → evidence.json (bounded, deterministic)
                       │
                       ▼
   analyze (this skill): read evidence.json + the OKF conventions index
                       │
                       ▼
   emit OKF: knowledge/retro/<run>/F-*.md (findings) + A-*.md (amendments)
                       │
                       ▼
   human accepts/rejects → harness changes → next retro audits whether they fired
```

### Step 1 — Collect (deterministic, already done by the script)

```bash
node scripts/retro/collect.js --window 14d --run sprint-7 --out evidence.json
# Enrich with GitHub evidence Hermes fetched via MCP (CI checks, issues, PRs):
node scripts/retro/collect.js --window 14d --run sprint-7 \
  --github-json gh.json --out evidence.json
```

### Step 2 — Run the three audits over `evidence.json`

- **Leak audit — "what got through that shouldn't have."**
  Signals: `git.reverts` (a merged change undone), `git.hotfixes` (fix referencing
  a recent PR), `post_merge_ci_failures`, `followup_bug_issues` (a bug filed
  against a merged PR). Each → `finding(severity: leak)` → `amendment(add-check |
  add-convention)`.
- **Dead-check audit — "what never fired."**
  Signals: `ci_checks` with `failures == 0` over many `runs` (cost without signal)
  → `amendment(delete-check)`; `flaky_retries > 0` → `amendment(fix-flaky)`.
- **Friction audit — "where a human/agent had to intervene."**
  Signals: `review_friction` with high `rounds`/`requested_changes`, long
  `time_to_merge`, repeated identical failures. Each → `finding(severity: friction)`
  → `amendment(add-convention | adjust-prompt | automate)`.

### Step 3 — Emit OKF findings and amendments

Write one Markdown file per concept under `knowledge/retro/<run>/`. OKF v0.1 shape:
Markdown + YAML frontmatter, `type` required.

**Finding** — `F-001.md`
```yaml
---
type: finding
id: F-2026-06-29-001
run: sprint-7
severity: leak            # leak | dead-check | friction
confidence: high          # high | medium | low
evidence:
  - kind: hotfix
    ref: c3d4e5f          # MUST resolve to a row in evidence.json
  - kind: bug-issue
    ref: issue#45
claim: "Null verse-ref crashed the reader; merged green, hotfixed 18h later. No check covers malformed references."
amendment: A-2026-06-29-001
---
# what was intended vs. what happened, and why nothing caught it
```

**Amendment** — `A-001.md`
```yaml
---
type: amendment
id: A-2026-06-29-001
kind: add-check           # add-check|delete-check|add-convention|delete-convention|fix-flaky|adjust-prompt
direction: add            # add | delete
target: ci/verse-ref-validation
justified_by: F-2026-06-29-001   # MUST cite a finding
status: proposed          # proposed | accepted | rejected
---
# the exact change. ADD only if no existing check covers it; DELETE only if dead/redundant.
```

## Guardrails

- **Bounded packet** — work only from `evidence.json`; do not re-read raw logs.
- **Cite-or-drop** — a finding without a resolvable `ref` is rejected.
- **Human gate** — all amendments are `proposed`; nothing self-applies.
- **Scope** — write only under `knowledge/retro/`; never touch production or weaken
  a check.

## Examples

- *"Run the sprint-7 retro."* → run collector → 3 leaks, 1 dead check, 2 friction
  findings → 6 amendments proposed → review PR opened.
- *"Why does e2e-android keep needing manual unblocks?"* → friction audit over
  `review_friction` + `flaky_retries` → `amendment(fix-flaky)` citing the run URLs.
- *"What checks can we delete?"* → dead-check audit → list of `ci_checks` with zero
  failures over N runs → `amendment(delete-check)` each.
