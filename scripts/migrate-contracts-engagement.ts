/**
 * Adds engagementId + fileMimeType to contracts, fileMimeType to proposals.
 * Run: npx tsx scripts/migrate-contracts-engagement.ts
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

async function addColumnIfMissing(table: string, column: string, type: string) {
  const exists = await sql.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  );
  if (!exists.length) {
    await sql.query(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${type}`);
    console.log(`  ✓ ${table}.${column} added`);
  } else {
    console.log(`  ✓ ${table}.${column} already exists, skipping`);
  }
}

async function run() {
  console.log("Adding columns...");

  await addColumnIfMissing("contracts", "engagement_id", "text");
  await addColumnIfMissing("contracts", "file_mime_type", "text");
  await addColumnIfMissing("proposals", "file_mime_type", "text");

  console.log("Adding FK constraint for contracts.engagement_id...");
  const fkExists = await sql.query(
    `SELECT 1 FROM information_schema.table_constraints
     WHERE table_name = 'contracts' AND constraint_name = 'contracts_engagement_id_engagements_id_fk'`
  );
  if (!fkExists.length) {
    await sql.query(
      `ALTER TABLE contracts ADD CONSTRAINT contracts_engagement_id_engagements_id_fk
       FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE SET NULL`
    );
    console.log("  ✓ FK constraint added");
  } else {
    console.log("  ✓ FK constraint already exists, skipping");
  }

  console.log("Adding index on contracts.engagement_id...");
  const idxExists = await sql.query(
    `SELECT 1 FROM pg_indexes WHERE indexname = 'contracts_engagement_id_idx'`
  );
  if (!idxExists.length) {
    await sql.query(`CREATE INDEX contracts_engagement_id_idx ON contracts (engagement_id)`);
    console.log("  ✓ Index added");
  } else {
    console.log("  ✓ Index already exists, skipping");
  }

  console.log("\nMigration complete.");
}

run().catch((err) => { console.error("Migration failed:", err); process.exit(1); });
