/**
 * Adds file_mime_type column to ndas (nullable text).
 * Run: npx tsx scripts/migrate-ndas-filemimetype.ts
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

async function run() {
  console.log("Adding ndas.file_mime_type...");

  const colExists = await sql.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = 'ndas' AND column_name = 'file_mime_type'`
  );
  if (!colExists.length) {
    await sql.query(`ALTER TABLE ndas ADD COLUMN file_mime_type text`);
    console.log("  ✓ ndas.file_mime_type added");
  } else {
    console.log("  - ndas.file_mime_type already exists, skipping");
  }

  console.log("\nMigration complete.");
}

run().catch((err) => { console.error("Migration failed:", err); process.exit(1); });
