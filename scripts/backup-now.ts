/**
 * One-time manual backup. Exports every table to backups/manual-{timestamp}.json.
 * Usage: npx tsx scripts/backup-now.ts
 */

import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

config({ path: join(ROOT, ".env.local") });

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set — add it to .env.local");
  process.exit(1);
}

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
] as const;

async function main() {
  const sql = neon(DATABASE_URL!);

  console.log("Exporting...");
  const snapshot: Record<string, unknown[]> = {};

  for (const table of TABLES) {
    const rows = await sql.query(`SELECT * FROM "${table}"`);
    snapshot[table] = rows;
    console.log(`  ${table}: ${rows.length} rows`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `manual-${timestamp}.json`;
  const outDir = join(ROOT, "backups");
  const outPath = join(outDir, filename);

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, JSON.stringify({ exportedAt: new Date().toISOString(), tables: snapshot }, null, 2));

  const bytes = Buffer.byteLength(JSON.stringify(snapshot));
  console.log(`\nWritten: backups/${filename} (${(bytes / 1024).toFixed(1)} KB)`);
}

main().catch((err) => { console.error(err); process.exit(1); });
