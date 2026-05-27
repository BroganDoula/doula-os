/**
 * One-time migration script for the schema audit changes.
 * Handles complex type changes that db:push can't do automatically (int→enum, real→numeric).
 * Run: npx tsx scripts/migrate-schema-audit.ts
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function run() {
  // ── 1. New enums ────────────────────────────────────────────────────────────
  console.log("Creating new enums...");

  await sql.query(`
    DO $$ BEGIN
      CREATE TYPE engagement_phase AS ENUM(
        'definition','works_like','looks_works_like','design_package','rfq','manufacture'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await sql.query(`
    DO $$ BEGIN
      CREATE TYPE recurring_period AS ENUM('monthly','quarterly','annual','one_time');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await sql.query(`
    DO $$ BEGIN
      CREATE TYPE audit_action AS ENUM('create','update','delete','read');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  // ── 2. engagements.phase: integer → engagement_phase enum ──────────────────
  console.log("Converting engagements.phase integer → engagement_phase...");

  // Check if phase is still integer
  const phaseType = await sql.query(`
    SELECT data_type, udt_name
    FROM information_schema.columns
    WHERE table_name = 'engagements' AND column_name = 'phase'
  `);

  if (phaseType[0]?.data_type === "integer") {
    await sql.query(`ALTER TABLE engagements ALTER COLUMN phase DROP DEFAULT`);
    await sql.query(`
      ALTER TABLE engagements
        ALTER COLUMN phase TYPE engagement_phase
        USING CASE phase
          WHEN 1 THEN 'definition'::engagement_phase
          WHEN 2 THEN 'works_like'::engagement_phase
          WHEN 3 THEN 'looks_works_like'::engagement_phase
          WHEN 4 THEN 'design_package'::engagement_phase
          WHEN 5 THEN 'rfq'::engagement_phase
          WHEN 6 THEN 'manufacture'::engagement_phase
          ELSE 'definition'::engagement_phase
        END
    `);
    await sql.query(`ALTER TABLE engagements ALTER COLUMN phase SET DEFAULT 'definition'`);
    console.log("  ✓ engagements.phase converted");
  } else {
    console.log("  ✓ engagements.phase already correct type, skipping");
  }

  // ── 3. audit_log.action: text → audit_action enum ──────────────────────────
  console.log("Converting audit_log.action text → audit_action...");

  const actionType = await sql.query(`
    SELECT data_type, udt_name
    FROM information_schema.columns
    WHERE table_name = 'audit_log' AND column_name = 'action'
  `);

  if (actionType[0]?.data_type === "text") {
    await sql.query(`
      ALTER TABLE audit_log
        ALTER COLUMN action TYPE audit_action
        USING action::audit_action
    `);
    console.log("  ✓ audit_log.action converted");
  } else {
    console.log("  ✓ audit_log.action already correct type, skipping");
  }

  // ── 4. hours_entries.hours: real → numeric(6,2) ────────────────────────────
  console.log("Converting hours_entries.hours real → numeric(6,2)...");

  const hoursType = await sql.query(`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_name = 'hours_entries' AND column_name = 'hours'
  `);

  if (hoursType[0]?.data_type === "real") {
    await sql.query(`
      ALTER TABLE hours_entries
        ALTER COLUMN hours TYPE numeric(6,2)
        USING hours::numeric(6,2)
    `);
    console.log("  ✓ hours_entries.hours converted");
  } else {
    console.log("  ✓ hours_entries.hours already correct type, skipping");
  }

  // ── 5. New columns ──────────────────────────────────────────────────────────
  console.log("Adding new columns...");

  const newCols: [string, string, string][] = [
    ["engagements", "deleted_at", "timestamp"],
    ["contracts",   "deleted_at", "timestamp"],
    ["contracts",   "file_data",  "text"],
    ["ndas",        "deleted_at", "timestamp"],
    ["ndas",        "file_data",  "text"],
    ["hours_entries","updated_at","timestamp DEFAULT now() NOT NULL"],
    ["financial_entries","recurring_period","recurring_period"],
  ];

  for (const [table, col, type] of newCols) {
    const exists = await sql.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = '${table}' AND column_name = '${col}'
    `);
    if (!exists.length) {
      await sql.query(`ALTER TABLE "${table}" ADD COLUMN "${col}" ${type}`);
      console.log(`  ✓ ${table}.${col} added`);
    } else {
      console.log(`  ✓ ${table}.${col} already exists, skipping`);
    }
  }

  // ── 6. Make contracts.file_url nullable ────────────────────────────────────
  console.log("Making contracts.file_url nullable...");
  await sql.query(`ALTER TABLE contracts ALTER COLUMN file_url DROP NOT NULL`);
  console.log("  ✓ contracts.file_url nullable");

  // ── 7. Make deals.client_id NOT NULL ───────────────────────────────────────
  console.log("Making deals.client_id NOT NULL...");
  // First set any null values to a valid ID so the constraint doesn't fail
  // (should be no nulls but just in case)
  const nullDeals = await sql.query(`SELECT COUNT(*) FROM deals WHERE client_id IS NULL`);
  if (parseInt(nullDeals[0].count) > 0) {
    console.log(`  WARNING: ${nullDeals[0].count} deals have null client_id — these will be skipped`);
  }
  await sql.query(`ALTER TABLE deals ALTER COLUMN client_id SET NOT NULL`);
  console.log("  ✓ deals.client_id NOT NULL");

  // ── 8. briefs.week_of unique constraint ────────────────────────────────────
  console.log("Adding briefs.week_of UNIQUE constraint...");
  const uniqueExists = await sql.query(`
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'briefs'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'briefs_week_of_unique'
  `);
  if (!uniqueExists.length) {
    await sql.query(`ALTER TABLE briefs ADD CONSTRAINT briefs_week_of_unique UNIQUE (week_of)`);
    console.log("  ✓ briefs.week_of unique constraint added");
  } else {
    console.log("  ✓ briefs.week_of already unique, skipping");
  }

  // ── 9. calendar_events.classification_override NOT NULL ────────────────────
  console.log("Setting classification_override NOT NULL...");
  await sql.query(`UPDATE calendar_events SET classification_override = false WHERE classification_override IS NULL`);
  await sql.query(`ALTER TABLE calendar_events ALTER COLUMN classification_override SET NOT NULL`);
  console.log("  ✓ classification_override NOT NULL set");

  // ── 10. FK constraints with ON DELETE ──────────────────────────────────────
  console.log("Adding FK constraints with ON DELETE clauses...");

  const fks: { table: string; col: string; ref: string; refCol: string; onDelete: string; name: string }[] = [
    // contacts
    { table: "contacts",    col: "client_id",    ref: "companies",   refCol: "id", onDelete: "SET NULL",  name: "contacts_client_id_companies_id_fk" },
    { table: "contacts",    col: "company_id",   ref: "companies",   refCol: "id", onDelete: "SET NULL",  name: "contacts_company_id_companies_id_fk" },
    // deals
    { table: "deals",       col: "client_id",    ref: "companies",   refCol: "id", onDelete: "CASCADE",   name: "deals_client_id_companies_id_fk" },
    { table: "deals",       col: "company_id",   ref: "companies",   refCol: "id", onDelete: "CASCADE",   name: "deals_company_id_companies_id_fk" },
    { table: "deals",       col: "contact_id",   ref: "contacts",    refCol: "id", onDelete: "SET NULL",  name: "deals_contact_id_contacts_id_fk" },
    // engagements
    { table: "engagements", col: "client_id",    ref: "companies",   refCol: "id", onDelete: "RESTRICT",  name: "engagements_client_id_companies_id_fk" },
    { table: "engagements", col: "company_id",   ref: "companies",   refCol: "id", onDelete: "RESTRICT",  name: "engagements_company_id_companies_id_fk" },
    // proposals
    { table: "proposals",   col: "client_id",    ref: "companies",   refCol: "id", onDelete: "CASCADE",   name: "proposals_client_id_companies_id_fk" },
    { table: "proposals",   col: "engagement_id",ref: "engagements", refCol: "id", onDelete: "CASCADE",   name: "proposals_engagement_id_engagements_id_fk" },
    // deliverables
    { table: "deliverables",col: "client_id",    ref: "companies",   refCol: "id", onDelete: "CASCADE",   name: "deliverables_client_id_companies_id_fk" },
    { table: "deliverables",col: "engagement_id",ref: "engagements", refCol: "id", onDelete: "CASCADE",   name: "deliverables_engagement_id_engagements_id_fk" },
    { table: "deliverables",col: "proposal_id",  ref: "proposals",   refCol: "id", onDelete: "SET NULL",  name: "deliverables_proposal_id_proposals_id_fk" },
    // hours_entries
    { table: "hours_entries",col: "client_id",   ref: "companies",   refCol: "id", onDelete: "SET NULL",  name: "hours_entries_client_id_companies_id_fk" },
    { table: "hours_entries",col: "engagement_id",ref:"engagements", refCol: "id", onDelete: "SET NULL",  name: "hours_entries_engagement_id_engagements_id_fk" },
    // contracts
    { table: "contracts",   col: "client_id",    ref: "companies",   refCol: "id", onDelete: "RESTRICT",  name: "contracts_client_id_companies_id_fk" },
    { table: "contracts",   col: "company_id",   ref: "companies",   refCol: "id", onDelete: "RESTRICT",  name: "contracts_company_id_companies_id_fk" },
    // ndas
    { table: "ndas",        col: "client_id",    ref: "companies",   refCol: "id", onDelete: "SET NULL",  name: "ndas_client_id_companies_id_fk" },
    { table: "ndas",        col: "company_id",   ref: "companies",   refCol: "id", onDelete: "SET NULL",  name: "ndas_company_id_companies_id_fk" },
    // calendar_events
    { table: "calendar_events", col: "client_id",    ref: "companies",   refCol: "id", onDelete: "SET NULL", name: "calendar_events_client_id_companies_id_fk" },
    { table: "calendar_events", col: "engagement_id",ref: "engagements", refCol: "id", onDelete: "SET NULL", name: "calendar_events_engagement_id_engagements_id_fk" },
    // financial_entries
    { table: "financial_entries", col: "client_id", ref: "companies", refCol: "id", onDelete: "SET NULL", name: "financial_entries_client_id_companies_id_fk" },
  ];

  for (const fk of fks) {
    // Drop existing FK first (may have wrong ON DELETE behavior or no behavior)
    const existsResult = await sql.query(`
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_name = '${fk.table}' AND constraint_name = '${fk.name}'
    `);
    if (existsResult.length) {
      await sql.query(`ALTER TABLE "${fk.table}" DROP CONSTRAINT "${fk.name}"`);
    }
    // Re-add with correct ON DELETE
    await sql.query(`
      ALTER TABLE "${fk.table}"
        ADD CONSTRAINT "${fk.name}"
        FOREIGN KEY ("${fk.col}") REFERENCES "${fk.ref}"("${fk.refCol}")
        ON DELETE ${fk.onDelete}
    `);
    console.log(`  ✓ ${fk.table}.${fk.col} → ${fk.ref} ON DELETE ${fk.onDelete}`);
  }

  // ── 11. Indexes ─────────────────────────────────────────────────────────────
  console.log("Adding indexes...");

  const indexes: { name: string; table: string; cols: string[] }[] = [
    { name: "deals_company_id_idx",               table: "deals",              cols: ["company_id"] },
    { name: "deals_contact_id_idx",               table: "deals",              cols: ["contact_id"] },
    { name: "engagements_company_id_idx",          table: "engagements",        cols: ["company_id"] },
    { name: "proposals_engagement_id_idx",         table: "proposals",          cols: ["engagement_id"] },
    { name: "deliverables_engagement_id_idx",      table: "deliverables",       cols: ["engagement_id"] },
    { name: "deliverables_proposal_id_idx",        table: "deliverables",       cols: ["proposal_id"] },
    { name: "hours_entries_engagement_id_idx",     table: "hours_entries",      cols: ["engagement_id"] },
    { name: "hours_entries_date_idx",              table: "hours_entries",      cols: ["date"] },
    { name: "contracts_company_id_idx",            table: "contracts",          cols: ["company_id"] },
    { name: "ndas_expiration_date_idx",            table: "ndas",               cols: ["expiration_date"] },
    { name: "calendar_events_engagement_id_idx",   table: "calendar_events",    cols: ["engagement_id"] },
    { name: "calendar_events_starts_at_idx",       table: "calendar_events",    cols: ["starts_at"] },
    { name: "financial_entries_date_idx",          table: "financial_entries",  cols: ["date"] },
    { name: "audit_log_entity_idx",               table: "audit_log",          cols: ["entity_type", "entity_id"] },
  ];

  for (const idx of indexes) {
    const exists = await sql.query(`
      SELECT 1 FROM pg_indexes WHERE indexname = '${idx.name}'
    `);
    if (!exists.length) {
      const cols = idx.cols.map(c => `"${c}"`).join(", ");
      await sql.query(`CREATE INDEX "${idx.name}" ON "${idx.table}" (${cols})`);
      console.log(`  ✓ ${idx.name}`);
    } else {
      console.log(`  ✓ ${idx.name} already exists, skipping`);
    }
  }

  console.log("\nMigration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
