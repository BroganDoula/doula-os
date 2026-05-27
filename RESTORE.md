# Restore from Backup

Backups are JSON snapshots of all database tables, committed daily to the `backups` branch of this repo by a GitHub Actions workflow.

---

## Prerequisites — add the DATABASE_URL secret

The GitHub Action needs read access to Neon. Add it once:

1. Go to **GitHub repo → Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `DATABASE_URL`
4. Value: the **pooled** Neon connection string (from the Neon dashboard → your project → Connection Details → select "Pooled connection")
5. Click **Add secret**

The daily workflow at `.github/workflows/backup.yml` reads this secret automatically.

---

## Where automated backups live

```
git fetch origin backups
git log origin/backups --oneline   # see all backup commits
```

Each commit on the `backups` branch adds one file at the branch root:

```
manual-2026-05-27T09-00-00.json
manual-2026-05-28T09-00-00.json
...
```

The JSON structure:

```json
{
  "exportedAt": "2026-05-27T09:00:12.000Z",
  "tables": {
    "companies": [...],
    "contacts":  [...],
    "deals":     [...],
    "..."
  }
}
```

Backups older than 30 days are pruned automatically by the workflow.

---

## Trigger a manual backup

**Via GitHub Actions (no local setup needed):**

1. Go to **GitHub repo → Actions → Daily Backup**
2. Click **Run workflow → Run workflow**
3. The new backup commits to the `backups` branch within ~1 minute

**Locally (requires `.env.local` with `DATABASE_URL`):**

```bash
npm run backup
```

This writes to `backups/manual-{timestamp}.json` in the working tree. It does **not** push to the `backups` branch — copy the file manually if you want to preserve it, or use the GitHub Actions trigger above.

---

## Fetch a specific backup file

```bash
git fetch origin backups
# List available files
git ls-tree --name-only origin/backups
# Extract a specific file
git show origin/backups:manual-2026-05-27T09-00-00.json > restore-data.json
```

---

## Restore procedure

> **Before restoring: take a fresh manual backup first** so you can undo if something goes wrong.
>
> ```bash
> npm run backup
> ```

### 1. Inspect the backup

```bash
node -e "const d=require('./restore-data.json'); Object.entries(d.tables).forEach(([t,r])=>console.log(t+': '+r.length+' rows'))"
```

### 2. Truncate and re-insert (destructive — replaces all data)

Create a one-off restore script at `scripts/restore.mjs` (do not commit — it is a one-time operation):

```js
import { readFileSync } from "fs";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);
const { tables } = JSON.parse(readFileSync("restore-data.json", "utf-8"));

// Tables in dependency order (parents before children).
const ORDER = [
  "companies", "contacts", "deals", "engagements",
  "proposals", "deliverables", "hours_entries",
  "contracts", "ndas", "calendar_events",
  "financial_entries", "briefs", "audit_log",
];

for (const table of ORDER.slice().reverse()) {
  await sql(`TRUNCATE "${table}" CASCADE`);
  console.log(`Truncated ${table}`);
}

for (const table of ORDER) {
  const rows = tables[table];
  if (!rows?.length) continue;
  const cols = Object.keys(rows[0]).map(c => `"${c}"`).join(", ");
  for (const row of rows) {
    const vals = Object.values(row);
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(", ");
    await sql(`INSERT INTO "${table}" (${cols}) VALUES (${placeholders})`, vals);
  }
  console.log(`Restored ${rows.length} rows → ${table}`);
}

console.log("Done.");
```

Run it:

```bash
node scripts/restore.mjs
```

Delete `scripts/restore.mjs` and `restore-data.json` afterward.

### 3. Partial restore (single table)

To restore only one table (e.g., `deals`) without touching others, extract just that key from the JSON and insert only those rows — omit the `TRUNCATE` loop and target a single table in the insert loop.

---

## Neon point-in-time recovery (alternative)

Neon Pro accounts include point-in-time restore from the Neon dashboard — no code required. If available, prefer this for faster recovery.

---

## Notes

- `contracts.file_data`, `proposals.file_data`, `ndas.file_data` contain base64-encoded file blobs. These are included in the backup and are restored correctly by the script above.
- Backups are retained for 30 days. The daily cron prunes files older than that automatically.
- The `backups/` directory is gitignored on `main` so local export files never appear in commits on main.
- The `backups` branch is an orphan branch — it has no shared history with `main`.
