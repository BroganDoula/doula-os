/**
 * Adds engagementId to ndas (nullable FK → engagements ON DELETE SET NULL).
 * Run: npx tsx scripts/migrate-ndas-engagement.ts
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
  console.log("Adding ndas.engagement_id...");

  const colExists = await sql.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = 'ndas' AND column_name = 'engagement_id'`
  );
  if (!colExists.length) {
    await sql.query(`ALTER TABLE ndas ADD COLUMN engagement_id text`);
    console.log("  ✓ ndas.engagement_id added");
  } else {
    console.log("  - ndas.engagement_id already exists, skipping");
  }

  console.log("Adding FK constraint...");
  const fkExists = await sql.query(
    `SELECT 1 FROM information_schema.table_constraints
     WHERE table_name = 'ndas' AND constraint_name = 'ndas_engagement_id_engagements_id_fk'`
  );
  if (!fkExists.length) {
    await sql.query(
      `ALTER TABLE ndas ADD CONSTRAINT ndas_engagement_id_engagements_id_fk
       FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE SET NULL`
    );
    console.log("  ✓ FK constraint added");
  } else {
    console.log("  - FK constraint already exists, skipping");
  }

  console.log("Adding index...");
  const idxExists = await sql.query(
    `SELECT 1 FROM pg_indexes WHERE indexname = 'ndas_engagement_id_idx'`
  );
  if (!idxExists.length) {
    await sql.query(`CREATE INDEX ndas_engagement_id_idx ON ndas (engagement_id)`);
    console.log("  ✓ Index added");
  } else {
    console.log("  - Index already exists, skipping");
  }

  console.log("\nMigration complete.");
}

run().catch((err) => { console.error("Migration failed:", err); process.exit(1); });
