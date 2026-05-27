# Restore from Backup

Backups are JSON snapshots of all database tables, committed daily to the `backups` branch of this repo.

## Where backups live

```
git fetch origin backups
git log origin/backups --oneline   # see all backup commits
```

Each commit on the `backups` branch adds or updates one file: `backups/YYYY-MM-DD.json`. The JSON structure is:

```json
{
  "exportedAt": "2026-05-27T03:00:12.000Z",
  "tables": {
    "companies": [...],
    "contacts":  [...],
    "deals":     [...],
    "..."
  }
}
```

## Fetch a specific backup file

```bash
git fetch origin backups
git show origin/backups:backups/2026-05-27.json > restore-data.json
```

## Restore procedure

> Before restoring: take a fresh manual backup first.
> ```
> npm run backup
> ```

### 1. Inspect the backup

```bash
node -e "const d=require('./restore-data.json'); Object.entries(d.tables).forEach(([t,r])=>console.log(t+': '+r.length+' rows'))"
```

### 2. Truncate and re-insert (destructive — replaces all data)

Create a one-off restore script at `scripts/restore.mjs` (do not commit this — it is a one-time operation):

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

Delete the script and the `restore-data.json` file afterward.

### 3. Partial restore (single table)

To restore only one table (e.g., `deals`) without touching others, extract just that key from the JSON and insert only those rows — omit the `TRUNCATE` loop and target a single table in the insert loop.

## Manual ad-hoc backup

Run before any risky migration or bulk delete:

```bash
npm run backup
```

This exports the current DB state and pushes it to `origin/backups` immediately.

## Neon point-in-time recovery (alternative)

Neon Pro accounts include point-in-time restore from the Neon dashboard — no code required. If available, prefer this for faster recovery.

## Notes

- `proposals.file_data` contains base64-encoded PDF blobs. These are included in the backup and will be restored correctly by the script above.
- Backups are retained for 30 days. The daily cron prunes files older than that from the `backups` branch automatically.
- The `backups/` directory is gitignored on `main` so local export files never pollute commits.
