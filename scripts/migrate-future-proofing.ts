/**
 * Forward-compat fields: audit seams, inbox seams, soft-delete, tagging, external-ids,
 * engagement profitability, pipeline analytics, NDA bidirectional, contract type.
 * Run: npx tsx scripts/migrate-future-proofing.ts
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
    console.log(`  - ${table}.${column} already exists`);
  }
}

async function run() {
  // ── 1. Audit fields: created_by, updated_by ───────────────────────────────
  console.log("\nAudit fields (created_by, updated_by)...");
  const auditTables = [
    "companies", "contacts", "deals", "engagements", "proposals",
    "deliverables", "hours_entries", "contracts", "ndas", "financial_entries",
  ];
  for (const table of auditTables) {
    await addColumnIfMissing(table, "created_by", "text");
    await addColumnIfMissing(table, "updated_by", "text");
  }

  // ── 2. reviewed_at (all manually-created entities) ────────────────────────
  console.log("\nreviewed_at...");
  for (const table of auditTables) {
    await addColumnIfMissing(table, "reviewed_at", "timestamp");
  }

  // ── 3. Soft-delete for newly-soft-deletable tables ────────────────────────
  console.log("\ndeleted_at (new tables)...");
  for (const table of ["contacts", "deals", "hours_entries", "financial_entries"]) {
    await addColumnIfMissing(table, "deleted_at", "timestamp");
  }

  // ── 4. Tags ───────────────────────────────────────────────────────────────
  console.log("\ntags...");
  for (const table of ["companies", "contacts", "deals", "engagements"]) {
    await addColumnIfMissing(table, "tags", "jsonb DEFAULT '[]'::jsonb");
  }

  // ── 5. External IDs ───────────────────────────────────────────────────────
  console.log("\nexternal_ids...");
  for (const table of ["companies", "contacts", "financial_entries"]) {
    await addColumnIfMissing(table, "external_ids", "jsonb DEFAULT '{}'::jsonb");
  }

  // ── 6. Document-inbox seams ───────────────────────────────────────────────
  console.log("\nDocument-inbox seams (source_document_id, extraction_confidence)...");
  for (const table of ["contracts", "proposals", "ndas"]) {
    await addColumnIfMissing(table, "source_document_id", "text");
    await addColumnIfMissing(table, "extraction_confidence", "real");
  }

  // ── 7. Engagement profitability ───────────────────────────────────────────
  console.log("\nEngagement profitability...");
  await addColumnIfMissing("engagements", "estimated_hours", "integer");
  await addColumnIfMissing("engagements", "estimated_revenue_cents", "integer");

  // ── 8. Pipeline analytics ─────────────────────────────────────────────────
  console.log("\nPipeline analytics...");
  await addColumnIfMissing("deals", "source_channel", "text");
  await addColumnIfMissing("deals", "lost_reason", "text");
  await addColumnIfMissing("deals", "won_at", "timestamp");
  await addColumnIfMissing("deals", "lost_at", "timestamp");

  // ── 9. NDA bidirectional (NOT NULL — safe two-step if rows exist) ─────────
  console.log("\nndas.bidirectional...");
  const colExists = await sql.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = 'ndas' AND column_name = 'bidirectional'`
  );
  if (colExists.length) {
    console.log("  - ndas.bidirectional already exists");
  } else {
    const countResult = await sql.query(`SELECT COUNT(*) AS count FROM ndas`);
    const count = parseInt((countResult[0] as { count: string }).count, 10);
    console.log(`  ndas row count: ${count}`);
    if (count === 0) {
      await sql.query(`ALTER TABLE ndas ADD COLUMN bidirectional boolean NOT NULL DEFAULT false`);
      console.log("  ✓ ndas.bidirectional added (single-step, table empty)");
    } else {
      await sql.query(`ALTER TABLE ndas ADD COLUMN bidirectional boolean DEFAULT false`);
      await sql.query(`UPDATE ndas SET bidirectional = false WHERE bidirectional IS NULL`);
      await sql.query(`ALTER TABLE ndas ALTER COLUMN bidirectional SET NOT NULL`);
      console.log(`  ✓ ndas.bidirectional added (two-step, ${count} rows backfilled)`);
    }
  }

  // ── 10. Contract type ─────────────────────────────────────────────────────
  console.log("\ncontract_type...");
  await addColumnIfMissing("contracts", "contract_type", "text");

  console.log("\nMigration complete.");
}

run().catch((err) => { console.error("Migration failed:", err); process.exit(1); });
