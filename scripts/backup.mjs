#!/usr/bin/env node
/**
 * Exports all DB tables to backups/YYYY-MM-DD.json and pushes the file to
 * the "backups" git branch. Uses git worktree so the current working branch
 * is never disturbed.
 *
 *   npm run backup          # normal use
 *   DATABASE_URL=... npm run backup   # override DB url
 */

import { execFileSync } from "child_process";
import { writeFileSync, readdirSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Load .env.local for local runs; CI injects env vars directly.
config({ path: join(ROOT, ".env.local") });

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set. Add it to .env.local or the environment.");
  process.exit(1);
}

// ── DB export ──────────────────────────────────────────────────────────────

const sql = neon(DATABASE_URL);

const TABLES = [
  "companies",
  "contacts",
  "deals",
  "engagements",
  "proposals",
  "deliverables",
  "hours_entries",
  "contracts",
  "ndas",
  "calendar_events",
  "financial_entries",
  "briefs",
  "audit_log",
];

console.log("Exporting database...");
const snapshot = { exportedAt: new Date().toISOString(), tables: {} };

for (const table of TABLES) {
  const rows = await sql(`SELECT * FROM "${table}"`);
  snapshot.tables[table] = rows;
  console.log(`  ${table}: ${rows.length} rows`);
}

const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const backupJson = JSON.stringify(snapshot, null, 2);

// ── Git helpers ────────────────────────────────────────────────────────────

// Run git in ROOT, inherit stdio (shows output).
const git = (...args) => execFileSync("git", args, { cwd: ROOT, stdio: "inherit" });

// Run git in ROOT silently, return stdout string.
const gitQ = (...args) =>
  execFileSync("git", args, { cwd: ROOT, stdio: "pipe", encoding: "utf-8" }).trim();

// Return true if command exits 0.
const gitOk = (...args) => {
  try {
    execFileSync("git", args, { cwd: ROOT, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
};

// Run git in a specific directory, inherit stdio.
const gitAt = (dir, ...args) =>
  execFileSync("git", args, { cwd: dir, stdio: "inherit" });

// ── Fetch remote state ─────────────────────────────────────────────────────

console.log("Fetching remote...");
try {
  git("fetch", "origin", "--prune");
} catch {
  console.warn("Warning: git fetch failed. Push may fail if offline.");
}

// Configure identity in CI.
if (process.env.CI) {
  git("config", "user.email", "github-actions[bot]@users.noreply.github.com");
  git("config", "user.name", "github-actions[bot]");
}

// ── Ensure backups branch exists on remote ─────────────────────────────────

const backupsBranchExists = gitOk("ls-remote", "--exit-code", "--heads", "origin", "backups");

if (!backupsBranchExists) {
  console.log("First run: creating orphan backups branch...");

  const initDir = join(tmpdir(), `doula-backups-init-${Date.now()}`);
  git("worktree", "add", "--orphan", "-b", "_backups_setup", initDir);

  try {
    writeFileSync(
      join(initDir, "README.md"),
      "# Doula OS — Backups\n\nAutomated daily database exports. 30-day retention.\nDo not edit manually.\n"
    );
    gitAt(initDir, "add", "README.md");
    gitAt(initDir, "commit", "-m", "chore: initialize backups branch");
    gitAt(initDir, "push", "origin", "HEAD:backups");
    console.log("backups branch created.");
  } finally {
    git("worktree", "remove", "--force", initDir);
    try {
      git("branch", "-D", "_backups_setup");
    } catch { /* may already be gone */ }
  }

  // Re-fetch so we can reference origin/backups.
  git("fetch", "origin", "backups");
}

// ── Write backup file via detached worktree ────────────────────────────────

const worktreeDir = join(tmpdir(), `doula-backup-${Date.now()}`);
git("worktree", "add", "--detach", worktreeDir, "origin/backups");

try {
  const backupsDir = join(worktreeDir, "backups");
  mkdirSync(backupsDir, { recursive: true });

  // Write today's backup.
  writeFileSync(join(backupsDir, `${date}.json`), backupJson);
  console.log(`Written: backups/${date}.json`);

  // Prune backups older than 30 days.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  let pruned = 0;
  for (const file of readdirSync(backupsDir)) {
    if (/^\d{4}-\d{2}-\d{2}\.json$/.test(file) && file.slice(0, 10) < cutoffDate) {
      unlinkSync(join(backupsDir, file));
      pruned++;
    }
  }
  if (pruned > 0) console.log(`Pruned ${pruned} file(s) older than 30 days.`);

  // Commit and push.
  gitAt(worktreeDir, "add", "backups/");

  const diff = execFileSync("git", ["status", "--porcelain", "backups/"], {
    cwd: worktreeDir,
    stdio: "pipe",
    encoding: "utf-8",
  }).trim();

  if (diff) {
    gitAt(worktreeDir, "commit", "-m", `backup: ${date}`);
    gitAt(worktreeDir, "push", "origin", "HEAD:backups");
    console.log("Pushed to origin/backups.");
  } else {
    console.log("Already backed up today — no new commit.");
  }
} finally {
  git("worktree", "remove", "--force", worktreeDir);
}

console.log("Done.");
