import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  real,
  date,
  boolean,
  jsonb,
  serial,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const dealStageEnum = pgEnum("deal_stage", [
  "prospect",
  "qualified",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
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

// ─── Core entities ────────────────────────────────────────────────────────────

export const companies = pgTable("companies", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  website: text("website"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// client_id on contact = the company that is our client (may differ from
// companyId if a contact works at a subsidiary or partner org)
export const contacts = pgTable("contacts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => companies.id),
  companyId: text("company_id").references(() => companies.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Sales / Pipeline ─────────────────────────────────────────────────────────

export const deals = pgTable("deals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  // client_id mirrors company_id for bulk-delete by client
  clientId: text("client_id").references(() => companies.id),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
  contactId: text("contact_id").references(() => contacts.id),
  stage: dealStageEnum("stage").notNull().default("prospect"),
  closeWindowMonths: integer("close_window_months"), // 3 | 6 | 9
  dealSizeCents: integer("deal_size_cents"),
  nextSteps: text("next_steps"),
  referralSource: text("referral_source"),
  notes: text("notes"),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Product Development ──────────────────────────────────────────────────────

// phase: 1=Definition 2=Works-Like 3=Looks-Works-Like
//        4=Design Package 5=RFQ 6=Manufacture
export const engagements = pgTable("engagements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id")
    .notNull()
    .references(() => companies.id),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
  name: text("name").notNull(),
  phase: integer("phase").notNull().default(1),
  rateCents: integer("rate_cents"),
  weeklyHourCommitment: integer("weekly_hour_commitment"),
  status: engagementStatusEnum("status").notNull().default("active"),
  startedAt: date("started_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const proposals = pgTable("proposals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id")
    .notNull()
    .references(() => companies.id),
  engagementId: text("engagement_id")
    .notNull()
    .references(() => engagements.id),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deliverables = pgTable("deliverables", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id")
    .notNull()
    .references(() => companies.id),
  engagementId: text("engagement_id")
    .notNull()
    .references(() => engagements.id),
  proposalId: text("proposal_id").references(() => proposals.id),
  title: text("title").notNull(),
  description: text("description"),
  status: deliverableStatusEnum("status").notNull().default("pending"),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Hours ────────────────────────────────────────────────────────────────────

export const hoursEntries = pgTable("hours_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => companies.id),
  engagementId: text("engagement_id").references(() => engagements.id),
  date: date("date").notNull(),
  hours: real("hours").notNull(),
  type: hoursTypeEnum("type").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Business / Admin ─────────────────────────────────────────────────────────

export const contracts = pgTable("contracts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id")
    .notNull()
    .references(() => companies.id),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  signedDate: date("signed_date"),
  termMonths: integer("term_months"),
  valueCents: integer("value_cents"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ndas = pgTable("ndas", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => companies.id),
  companyId: text("company_id").references(() => companies.id),
  counterparty: text("counterparty").notNull(),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  signedDate: date("signed_date"),
  expirationDate: date("expiration_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Calendar ─────────────────────────────────────────────────────────────────

export const calendarEvents = pgTable("calendar_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  googleEventId: text("google_event_id").unique(),
  clientId: text("client_id").references(() => companies.id),
  engagementId: text("engagement_id").references(() => engagements.id),
  title: text("title").notNull(),
  description: text("description"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at"),
  classification: calendarClassificationEnum("classification"),
  classificationOverride: boolean("classification_override").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Financial ────────────────────────────────────────────────────────────────

// All monetary values stored in cents.
export const financialEntries = pgTable("financial_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => companies.id),
  type: financialEntryTypeEnum("type").notNull(),
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  date: date("date").notNull(),
  dueDate: date("due_date"),
  paidAt: timestamp("paid_at"),
  recurringPeriod: text("recurring_period"), // 'monthly' | 'annual' | etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Agent output ─────────────────────────────────────────────────────────────

export const briefs = pgTable("briefs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  weekOf: date("week_of").notNull(),
  content: text("content").notNull(),
  rawData: jsonb("raw_data"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Safety ───────────────────────────────────────────────────────────────────

// High-write append-only table; serial PK avoids UUID overhead.
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(), // 'create' | 'update' | 'delete' | 'read'
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  clientId: text("client_id"),
  diff: jsonb("diff"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
