#!/usr/bin/env node
/**
 * Retro evidence collector (deterministic half of the retro engine).
 *
 * Principle: "code collects, model judges." This script gathers tamper-resistant
 * evidence from git (and, optionally, pre-fetched GitHub data) into a bounded
 * evidence.json. The LLM analyzer reads ONLY that file and may interpret rows,
 * never invent them.
 *
 * Usage:
 *   node scripts/retro/collect.js --window 14d --run sprint-7 --out evidence.json
 *   node scripts/retro/collect.js --since 2026-06-15 --until 2026-06-29 \
 *        --github-json gh.json --out evidence.json
 *
 * GitHub-sourced fields (ci_checks, followup_bug_issues, review_friction) are not
 * reachable from a plain script. Hermes fetches them via the GitHub MCP and passes
 * them in with --github-json; without it those arrays stay empty (documented gap,
 * not a silent one).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CAP = 200; // bound every evidence array so the packet stays small

function parseArgs(argv) {
  const out = { window: '14d', run: null, since: null, until: null, repo: process.cwd(), githubJson: null, out: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--window') out.window = next();
    else if (a === '--run') out.run = next();
    else if (a === '--since') out.since = next();
    else if (a === '--until') out.until = next();
    else if (a === '--repo') out.repo = next();
    else if (a === '--github-json') out.githubJson = next();
    else if (a === '--out') out.out = next();
    else if (a === '--help' || a === '-h') { printHelp(); process.exit(0); }
  }
  return out;
}

function printHelp() {
  console.log(`Retro evidence collector

  --window <Nd>        lookback window in days (default 14d); ignored if --since given
  --since <ISO>        start of window (e.g. 2026-06-15)
  --until <ISO>        end of window (default: now)
  --run <label>        run identifier written into evidence.json
  --repo <path>        git repo to inspect (default: cwd)
  --github-json <file> pre-fetched GitHub evidence to merge (ci_checks, issues, PRs)
  --out <file>         write evidence.json here (default: stdout)
`);
}

function git(repo, args) {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function resolveSince(opts) {
  if (opts.since) return opts.since;
  const m = /^(\d+)d$/.exec(opts.window || '');
  const days = m ? Number(m[1]) : 14;
  return `${days} days ago`;
}

// One commit record per line: SHA, ISO date, subject — newline-safe via NUL.
function readCommits(repo, since, until) {
  const range = ['log', `--since=${since}`];
  if (until) range.push(`--until=${until}`);
  range.push('--no-merges', '--pretty=format:%H%x1f%aI%x1f%s');
  const raw = git(repo, range).trim();
  if (!raw) return [];
  return raw.split('\n').map(line => {
    const [sha, date, subject] = line.split('\x1f');
    return { sha, date, subject: subject || '' };
  });
}

function readMerges(repo, since, until) {
  const range = ['log', `--since=${since}`];
  if (until) range.push(`--until=${until}`);
  range.push('--merges', '--pretty=format:%H%x1f%s');
  const raw = git(repo, range).trim();
  if (!raw) return [];
  return raw.split('\n').map(line => {
    const [sha, subject] = line.split('\x1f');
    const pr = /#(\d+)/.exec(subject || '');
    return { sha, pr: pr ? Number(pr[1]) : null, subject: subject || '' };
  });
}

// A revert commit names the SHA it undoes: "This reverts commit <sha>."
function detectReverts(repo, since, until) {
  const range = ['log', `--since=${since}`, '--grep=This reverts commit'];
  if (until) range.push(`--until=${until}`);
  range.push('--pretty=format:%H%x1e%b%x1d');
  const raw = git(repo, range).trim();
  if (!raw) return [];
  return raw.split('\x1d').filter(Boolean).map(block => {
    const [sha, body] = block.split('\x1e');
    const m = /This reverts commit ([0-9a-f]{7,40})/.exec(body || '');
    return { sha: (sha || '').trim(), reverts_sha: m ? m[1] : null };
  }).filter(r => r.sha);
}

// Heuristic: fix/hotfix-flavored commits that reference a PR or issue number.
function detectHotfixes(commits) {
  const rx = /\b(hotfix|fix|patch|revert)\b/i;
  return commits
    .filter(c => rx.test(c.subject))
    .map(c => {
      const ref = /#(\d+)/.exec(c.subject);
      return { sha: c.sha, fixes_ref: ref ? Number(ref[1]) : null, subject: c.subject };
    });
}

function churnByFile(repo, since, until) {
  const range = ['log', `--since=${since}`, '--no-merges', '--numstat', '--pretty=format:'];
  if (until) range.push(`--until=${until}`);
  const raw = git(repo, range);
  const counts = new Map();
  for (const line of raw.split('\n')) {
    const m = /^(\d+|-)\t(\d+|-)\t(.+)$/.exec(line);
    if (!m) continue;
    const add = m[1] === '-' ? 0 : Number(m[1]);
    const del = m[2] === '-' ? 0 : Number(m[2]);
    const file = m[3];
    const prev = counts.get(file) || { file, commits: 0, churn: 0 };
    prev.commits += 1;
    prev.churn += add + del;
    counts.set(file, prev);
  }
  return [...counts.values()].sort((a, b) => b.churn - a.churn).slice(0, CAP);
}

function cap(arr) { return Array.isArray(arr) ? arr.slice(0, CAP) : arr; }

function build(opts) {
  const repo = path.resolve(opts.repo);
  const since = resolveSince(opts);
  const until = opts.until || null;

  const commits = readCommits(repo, since, until);
  const reverts = detectReverts(repo, since, until);
  const merges = readMerges(repo, since, until);
  const hotfixes = detectHotfixes(commits);

  // Optional GitHub evidence (fetched by Hermes via MCP, passed in).
  let gh = {};
  if (opts.githubJson) {
    gh = JSON.parse(fs.readFileSync(opts.githubJson, 'utf8'));
  }

  const evidence = {
    schema: 'retro.evidence.v1',
    run: opts.run || `window:${since}..${until || 'now'}`,
    window: { since, until: until || 'now' },
    repo: path.basename(repo),
    sources_present: {
      git: true,
      github: Boolean(opts.githubJson),
    },
    git: {
      commit_count: commits.length,
      merged_prs: cap(merges.filter(m => m.pr).map(m => m.pr)),
      reverts: cap(reverts),
      hotfixes: cap(hotfixes),
      top_churn: churnByFile(repo, since, until),
    },
    // GitHub-derived; empty (with sources_present.github=false) when not supplied.
    ci_checks: cap(gh.ci_checks || []),
    post_merge_ci_failures: cap(gh.post_merge_ci_failures || []),
    followup_bug_issues: cap(gh.followup_bug_issues || []),
    review_friction: cap(gh.review_friction || []),
  };
  return evidence;
}

function main() {
  const opts = parseArgs(process.argv);
  let evidence;
  try {
    evidence = build(opts);
  } catch (err) {
    console.error(`[Retro] evidence collection failed: ${err.message}`);
    process.exit(1);
  }
  const json = JSON.stringify(evidence, null, 2);
  if (opts.out) {
    fs.writeFileSync(opts.out, json + '\n');
    console.error(`[Retro] wrote ${opts.out} (${evidence.git.commit_count} commits, github=${evidence.sources_present.github})`);
  } else {
    process.stdout.write(json + '\n');
  }
}

if (require.main === module) {
  main();
}

module.exports = { build, parseArgs, resolveSince, detectReverts, detectHotfixes };
