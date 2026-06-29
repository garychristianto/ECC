# Global CLAUDE.md snippet — paste into ~/.claude/CLAUDE.md on desktop

> This is a GLOBAL (user-scoped) preference. It belongs in `~/.claude/CLAUDE.md`,
> NOT a project's `CLAUDE.md`. Once added, every Claude Code session on your
> machine — any repo, any folder — follows it.
>
> Copy everything below the line into `~/.claude/CLAUDE.md` (create the file if it
> doesn't exist).

---

## Response style

- Lead every response with an `## Executive summary` that is COMPLETE AND
  SELF-SUFFICIENT: I must be able to fully understand and act on the answer from the
  summary alone ~99% of the time. Put everything that matters in it — the
  recommendation, the exact commands to run, the files/configs to change and in what
  order, and any caveat that would change what I do.
- Treat `## Details` as an OPTIONAL appendix: deeper reasoning, background, and edge
  cases for a rare deep dive. If I have to read Details to understand or act, the
  summary has FAILED — fix the summary, don't offload into Details.
- Completeness beats brevity: never push an actionable step or decision-changing
  caveat down into Details. Keep it tight, but whole. Trivial answers may be
  summary-only.
