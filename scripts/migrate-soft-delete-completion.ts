/**
 * Adds deleted_at to companies and deliverables tables.
 * The other entities (contacts, deals, hours_entries, ndas, contracts,
 * engagements, financial_entries) already have this column.
 * Run: npx tsx scripts/migrate-soft-delete-completion.ts
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = neon(DATABASE_URL);

async function addColumnIfMissing(table: string, column: string, definition: string) {
  const exists = await sql.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  );
  if (!exists.length) {
    await sql.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`  ✓ ${table}.${column} added`);
  } else {
    console.log(`  - ${table}.${column} already exists, skipping`);
  }
}

async function run() {
  console.log("Completing soft-delete column coverage...");
  await addColumnIfMissing("companies", "deleted_at", "timestamptz");
  await addColumnIfMissing("deliverables", "deleted_at", "timestamptz");
  console.log("\nMigration complete.");
}

run().catch((err) => { console.error("Migration failed:", err); process.exit(1); });
