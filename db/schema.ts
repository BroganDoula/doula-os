import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  customType,
  date,
  boolean,
  jsonb,
  real,
  serial,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Postgres numeric returns strings over the wire. This custom type maps it to
// JS number at the Drizzle layer so callers never see strings.
const numericAsNumber = customType<{ data: number; driverData: string }>({
  dataType() {
    return "numeric(6, 2)";
  },
  fromDriver(value) {
    return parseFloat(value as string);
  },
  toDriver(value) {
    return String(value);
  },
});

// ─── Enums ────────────────────────────────────────────────────────────────────

export const dealStageEnum = pgEnum("deal_stage", [
  "prospect",
  "qualified",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
]);

export const engagementPhaseEnum = pgEnum("engagement_phase", [
  "definition",
  "works_like",
  "looks_works_like",
  "design_package",
  "rfq",
  "manufacture",
]);

export const engagementStatusEnum = pgEnum("engagement_status", [
  "active",
  "paused",
  "complete",
]);

export const deliverableStatusEnum = pgEnum("deliverable_status", [
  "pending",
  "in_progress",
  "complete",
]);

export const hoursTypeEnum = pgEnum("hours_type", [
  "client",
  "bd",
  "admin",
  "driving",
]);

export const calendarClassificationEnum = pgEnum("calendar_classification", [
  "sales",
  "client_work",
  "admin",
  "driving",
  "other",
]);

export const financialEntryTypeEnum = pgEnum("financial_entry_type", [
  "revenue",
  "cash_on_hand",
  "recurring_cost",
  "ar_item",
]);

export const recurringPeriodEnum = pgEnum("recurring_period", [
  "monthly",
  "quarterly",
  "annual",
  "one_time",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "read",
]);

// ─── Core entities ────────────────────────────────────────────────────────────

export const companies = pgTable("companies", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  website: text("website"),
  notes: text("notes"),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  reviewedAt: timestamp("reviewed_at"),
  tags: jsonb("tags").$type<string[]>().default([]),
  externalIds: jsonb("external_ids").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export const contacts = pgTable("contacts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  // set null — contact survives if either company is deleted
  clientId: text("client_id").references(() => companies.id, { onDelete: "set null" }),
  // set null — contact survives if employer company is deleted
  companyId: text("company_id").references(() => companies.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role"),
  notes: text("notes"),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  reviewedAt: timestamp("reviewed_at"),
  tags: jsonb("tags").$type<string[]>().default([]),
  externalIds: jsonb("external_ids").$type<Record<string, string>>().default({}),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
});

// ─── Sales / Pipeline ─────────────────────────────────────────────────────────

export const deals = pgTable(
  "deals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // cascade — deal belongs to its company; delete company → delete deal
    clientId: text("client_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    // cascade — same company, same intent as clientId
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    // set null — deal survives if contact is deleted
    contactId: text("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    stage: dealStageEnum("stage").notNull().default("prospect"),
    closeWindowMonths: integer("close_window_months"),
    dealSizeCents: integer("deal_size_cents"),
    nextSteps: text("next_steps"),
    referralSource: text("referral_source"),
    notes: text("notes"),
    lastActivityAt: timestamp("last_activity_at").defaultNow(),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    reviewedAt: timestamp("reviewed_at"),
    tags: jsonb("tags").$type<string[]>().default([]),
    sourceChannel: text("source_channel"),
    lostReason: text("lost_reason"),
    wonAt: timestamp("won_at"),
    lostAt: timestamp("lost_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("deals_company_id_idx").on(table.companyId),
    index("deals_contact_id_idx").on(table.contactId),
  ]
);

// ─── Product Development ──────────────────────────────────────────────────────

// Phases: definition → works_like → looks_works_like → design_package → rfq → manufacture
export const engagements = pgTable(
  "engagements",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // restrict — engagement has hours/deliverables/proposals; must soft-delete engagement before deleting company
    clientId: text("client_id")
      .notNull()
      .references(() => companies.id, { onDelete: "restrict" }),
    // restrict — same intent
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    phase: engagementPhaseEnum("phase").notNull().default("definition"),
    rateCents: integer("rate_cents"),
    weeklyHourCommitment: integer("weekly_hour_commitment"),
    status: engagementStatusEnum("status").notNull().default("active"),
    startedAt: date("started_at"),
    notes: text("notes"),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    reviewedAt: timestamp("reviewed_at"),
    tags: jsonb("tags").$type<string[]>().default([]),
    estimatedHours: integer("estimated_hours"),
    estimatedRevenueCents: integer("estimated_revenue_cents"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("engagements_company_id_idx").on(table.companyId),
  ]
);

export const proposals = pgTable(
  "proposals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // cascade — proposal belongs to its client; delete client → delete proposal
    clientId: text("client_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    // cascade — proposal belongs to its engagement
    engagementId: text("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    fileData: text("file_data"),
    fileUrl: text("file_url"),
    fileName: text("file_name").notNull(),
    fileMimeType: text("file_mime_type"),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    reviewedAt: timestamp("reviewed_at"),
    sourceDocumentId: text("source_document_id"),
    extractionConfidence: real("extraction_confidence"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("proposals_engagement_id_idx").on(table.engagementId),
  ]
);

export const deliverables = pgTable(
  "deliverables",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // cascade — deliverable belongs to its client
    clientId: text("client_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    // cascade — deliverable belongs to its engagement
    engagementId: text("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    // set null — deliverable survives if proposal is deleted
    proposalId: text("proposal_id").references(() => proposals.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    status: deliverableStatusEnum("status").notNull().default("pending"),
    dueDate: date("due_date"),
    completedAt: timestamp("completed_at"),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("deliverables_engagement_id_idx").on(table.engagementId),
    index("deliverables_proposal_id_idx").on(table.proposalId),
  ]
);

// ─── Hours ────────────────────────────────────────────────────────────────────

export const hoursEntries = pgTable(
  "hours_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // set null — hours survive if client is deleted; admin/driving entries have no client anyway
    clientId: text("client_id").references(() => companies.id, { onDelete: "set null" }),
    // set null — hours survive if engagement is deleted (data must not be lost)
    engagementId: text("engagement_id").references(() => engagements.id, { onDelete: "set null" }),
    date: date("date").notNull(),
    hours: numericAsNumber("hours").notNull(),
    type: hoursTypeEnum("type").notNull(),
    notes: text("notes"),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    reviewedAt: timestamp("reviewed_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("hours_entries_engagement_id_idx").on(table.engagementId),
    index("hours_entries_date_idx").on(table.date),
  ]
);

// ─── Business / Admin ─────────────────────────────────────────────────────────

export const contracts = pgTable(
  "contracts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // restrict — block deleting a company that has contracts (legal record)
    clientId: text("client_id")
      .notNull()
      .references(() => companies.id, { onDelete: "restrict" }),
    // restrict — same
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "restrict" }),
    // set null — contract survives if engagement is deleted; many contracts span multiple engagements
    engagementId: text("engagement_id").references(() => engagements.id, { onDelete: "set null" }),
    fileData: text("file_data"),
    fileUrl: text("file_url"),
    fileName: text("file_name").notNull(),
    fileMimeType: text("file_mime_type"),
    signedDate: date("signed_date"),
    termMonths: integer("term_months"),
    valueCents: integer("value_cents"),
    notes: text("notes"),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    reviewedAt: timestamp("reviewed_at"),
    sourceDocumentId: text("source_document_id"),
    extractionConfidence: real("extraction_confidence"),
    contractType: text("contract_type"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("contracts_company_id_idx").on(table.companyId),
    index("contracts_engagement_id_idx").on(table.engagementId),
  ]
);

export const ndas = pgTable(
  "ndas",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // set null — NDA can exist without a client link (prospect or partner NDAs)
    clientId: text("client_id").references(() => companies.id, { onDelete: "set null" }),
    // set null — same
    companyId: text("company_id").references(() => companies.id, { onDelete: "set null" }),
    counterparty: text("counterparty").notNull(),
    fileData: text("file_data"),
    fileUrl: text("file_url"),
    fileName: text("file_name"),
    signedDate: date("signed_date"),
    expirationDate: date("expiration_date"),
    notes: text("notes"),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    reviewedAt: timestamp("reviewed_at"),
    sourceDocumentId: text("source_document_id"),
    extractionConfidence: real("extraction_confidence"),
    bidirectional: boolean("bidirectional").notNull().default(false),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("ndas_expiration_date_idx").on(table.expirationDate),
  ]
);

// ─── Calendar ─────────────────────────────────────────────────────────────────

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    googleEventId: text("google_event_id").unique(),
    // set null — event survives if client is deleted
    clientId: text("client_id").references(() => companies.id, { onDelete: "set null" }),
    // set null — event survives if engagement is deleted
    engagementId: text("engagement_id").references(() => engagements.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at"),
    classification: calendarClassificationEnum("classification"),
    classificationOverride: boolean("classification_override").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("calendar_events_engagement_id_idx").on(table.engagementId),
    index("calendar_events_starts_at_idx").on(table.startsAt),
  ]
);

// ─── Financial ────────────────────────────────────────────────────────────────

// All monetary values stored in cents.
export const financialEntries = pgTable(
  "financial_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // set null — recurring costs (Adobe etc.) have no client; AR items survive if client is deleted
    clientId: text("client_id").references(() => companies.id, { onDelete: "set null" }),
    type: financialEntryTypeEnum("type").notNull(),
    description: text("description").notNull(),
    amountCents: integer("amount_cents").notNull(),
    date: date("date").notNull(),
    dueDate: date("due_date"),
    paidAt: timestamp("paid_at"),
    recurringPeriod: recurringPeriodEnum("recurring_period"),
    notes: text("notes"),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    reviewedAt: timestamp("reviewed_at"),
    externalIds: jsonb("external_ids").$type<Record<string, string>>().default({}),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("financial_entries_date_idx").on(table.date),
  ]
);

// ─── Agent output ─────────────────────────────────────────────────────────────

export const briefs = pgTable("briefs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  weekOf: date("week_of").notNull().unique(),
  content: text("content").notNull(),
  rawData: jsonb("raw_data"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Safety ───────────────────────────────────────────────────────────────────

// High-write append-only table; serial PK avoids UUID overhead.
export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    actor: text("actor").notNull(),
    action: auditActionEnum("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    clientId: text("client_id"),
    diff: jsonb("diff"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_log_entity_idx").on(table.entityType, table.entityId),
  ]
);

// ─── Inferred types ───────────────────────────────────────────────────────────

export type Company = typeof companies.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type Engagement = typeof engagements.$inferSelect;
export type Proposal = typeof proposals.$inferSelect;
export type Deliverable = typeof deliverables.$inferSelect;
export type HoursEntry = typeof hoursEntries.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type Nda = typeof ndas.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type FinancialEntry = typeof financialEntries.$inferSelect;
export type Brief = typeof briefs.$inferSelect;
