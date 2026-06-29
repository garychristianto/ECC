# Hermes × ECC × OKF — Alkitab Indonesia stack

Tomorrow's bring-up kit. Encodes the layered model from the design sessions:

| Layer | Role | This kit |
|---|---|---|
| **Harness** (runtime) | runs the loop, spawns ephemeral agents, cron, memory | Hermes (`config.yaml`) |
| **Capability** | what the crew knows how to do | ECC skills/agents (lean global core + per-repo overlay) |
| **Knowledge** | durable facts & decisions every agent reads | OKF bundles (`okf/`) |

> **Mandor is not the center.** Its gate ≈ CI, its dispatch is better served by
> ECC, and its one non-commodity asset — the **retro** — is extracted standalone
> in this repo (`scripts/retro/collect.js` + `skills/retro/SKILL.md`). See
> `okf/decisions/0001-stack-shape.md`.

## What's in here

```
config.yaml                     # Hermes config template → copy to ~/.hermes/config.yaml
okf/
  bible-facts/                  # the domain-knowledge gap, as OKF
    verse-ref-format.md         #   parse/validate/render rules (the oracle)
    book-codes.md               #   OSIS ↔ Indonesian names (INCOMPLETE — verify)
    translations.md             #   editions + licensing (VERIFY licensing)
  conventions/                  # reusable oracles the retro audits against
    verse-ref-validation.md
  decisions/                    # ADR-style semantic memory ("what we decided")
    0001-stack-shape.md
```

The retro engine itself lives at repo root: `scripts/retro/collect.js`,
`skills/retro/SKILL.md`, `tests/retro/collect.test.js`.

## Bring-up order (do these tomorrow, in order)

**0. Pick the mobile framework.** This kit defaults to **Flutter**. If Alkitab is
Kotlin/Swift/React Native, use the swap table below before step 3.

**1. Install ECC + verify baseline.**
```bash
node tests/run-all.js            # expect zero failures
```

**2. Layer A — global capability core into Hermes (keep it LEAN).**
```bash
npx ecc consult "deep-research content-engine crosspost autonomous-loops retro" --target claude
ecc migrate import-skills --output-dir ~/.hermes/skills/ecc-imports
```
Then copy `config.yaml` → `~/.hermes/config.yaml` and fill real paths/keys.
The `skills.global_core` list (~14) is the always-on set — do not expand it casually.

**3. Layer B — per-repo overlay, scoped to the Alkitab repo only.**
```bash
cd ~/code/alkitab-indonesia
npx ecc-install --target claude-project \
  --with framework:flutter --with capability:accessibility
# writes ./.claude/ — never touches ~/.claude or other repos
```

**4. Layer C — knowledge.** Copy `okf/` → `~/.hermes/workspace/alkitab/okf/`, then:
- Complete `book-codes.md` (all 66 books) and **verify** names/chapter counts.
- Fill `translations.md` licensing from the rights holder before publishing verses.

**5. Register MCPs you actually use** (`config.yaml` → `mcp:`). Remember:
`deep-research` needs firecrawl OR exa or it won't function.

**6. Start a SMALL cron surface:** `verse-of-the-day`, `sprint-retro`,
`store-listing-canary` (already stubbed in `config.yaml`). Add heavier workflows
only after these are stable.

## Framework swap table (step 3)

| Framework | `--with` | Overlay skills / agents / rules |
|---|---|---|
| Flutter (default) | `framework:flutter` | dart-flutter-patterns · flutter-reviewer · dart-build-resolver · rules/dart |
| Kotlin/Android | `framework:kotlin` | android-clean-architecture, kotlin-patterns · kotlin-reviewer · rules/kotlin |
| Swift/iOS | `framework:swift` | swiftui-patterns · swift-reviewer · rules/swift |
| React Native | `framework:react` | react-reviewer · rules/react |

Edit `config.yaml → repo_overlays.alkitab-indonesia` to match.

## Run the retro (any time, no Mandor required)

```bash
cd ~/code/alkitab-indonesia
node /path/to/ECC/scripts/retro/collect.js --window 7d --run "week-of-$(date +%F)" --out evidence.json
# (optional) enrich with GitHub evidence Hermes fetched via MCP:
#   --github-json gh.json
```
Then invoke the `retro` skill over `evidence.json` + `okf/conventions`. It writes
findings + amendments under `okf/retro/<run>/` and opens a review PR. Cite-or-drop;
proposes only; never weakens a check.

## The two manual gaps (don't skip)

1. **`book-codes.md` is intentionally incomplete** — finish and verify the canon.
2. **`translations.md` licensing is unconfirmed** — confirm before publishing any
   verse text externally.
