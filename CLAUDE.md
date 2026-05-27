# Doula OS — Build Spec

Internal operations app for Doula Studios (hardware product development consultancy).
Single user. Not marketable. Optimized for the founder's daily workflow.

---

## Architecture

- **Hosting:** Vercel, deployed at `app.doula-studios.com` (separate project from portfolio site)
- **Framework:** Next.js 15 (App Router) + TypeScript
- **DB:** Postgres on Neon (encrypted at rest)
- **ORM:** Drizzle
- **Auth:** Clerk, single user, passkey or TOTP
- **Scheduled jobs:** Vercel Cron
- **LLM:** Anthropic SDK — Sonnet 4.6 for nightly parsing, Opus 4.7 for weekly synthesis
- **UI:** Tailwind + shadcn/ui
- **Exports:** `exceljs` (multi-sheet workbooks)
- **Email (for exports/alerts):** Resend or similar

**Not offline-capable.** Offline access is satisfied via weekly + on-demand `.xlsx` exports.

---

## Tranche 1 — MVP (target: 3–4 weeks)

Ship this. Resist additions. Definition of done: founder logs in daily for 2 weeks without falling back to spreadsheets.

### Sales / Pipeline
- Pipeline table: contact, company, stage, expected close window (3 / 6 / 9 months), deal size, next steps, referral source
- Google Calendar integration: pull events, auto-classify sales vs. client work vs. other
- Manual override on classification

### Product Development
- Client list with current phase from the 6-phase model:
  1. Definition (what are we making)
  2. Works-Like (how are we making it)
  3. Looks-Works-Like (make it beautiful)
  4. Design Package (make it manufacturable)
  5. RFQ (find who's going to make it)
  6. Manufacture (make it)
- Proposal upload (PDF) per engagement
- Deliverable checklist per engagement (manually entered from proposal, checked off as completed)
- Manual hours logging per client

### Business
- Contracts database (upload + metadata: client, signed date, term, value)
- NDA database (upload + metadata: counterparty, signed date, expiration)
- NDA expiration alerts
- Per-client weekly hour commitment + actuals tracking

### Financial (manual entry in MVP)
- Revenue (monthly)
- Cash on hand
- Recurring costs (Adobe, etc.)
- AR aging: manual list of outstanding invoices (auto-pull from Xero is Tranche 2)

### Exports
- **On-demand snapshot button** → timestamped `.xlsx` (e.g. `doula-snapshot-2026-05-26-1430.xlsx`)
  - Multi-sheet single workbook: Pipeline, Active Engagements, Admin Queue, Recent Activity, Open Action Items
- **Weekly Sunday auto-export** → email to founder + drop into a designated Google Drive folder
- **Full DB dump** export (one sheet per table) for portability

### Agent (nightly Vercel Cron)
- Reads day's deltas (calendar events, manual entries)
- Flags:
  - Stale pipeline threads (no activity in N days)
  - Overdue deliverables
  - Weekly hour commitment vs. actual variance
  - NDAs expiring in next 30/60/90 days
- Generates **Monday morning brief**: top 3 deals to close, top 3 client risks, top 3 admin items

### Safety / Risk
- 2FA on all dependent services (Vercel, Neon, Anthropic, GitHub, Google, Clerk)
- DB-level encryption at rest
- Nightly automated backup of Postgres → S3 or equivalent
- Backup verification: weekly cron checks the latest backup is non-empty and recent; alerts on failure
- Audit log: every read/write on client records
- Secrets in Vercel env vars, never committed
- Session timeout on inactivity
- Every client record tagged with `client_id` for clean future deletion

---

## Tranche 2 — Earned after 4–6 weeks of Tranche 1 daily use

Add only items that Tranche 1 usage proves are needed.

### Integrations
- Xero integration → automated AR aging, revenue pull
- Stripe integration → payment status
- Harvest integration → hours sync (nice-to-have, not required)

### Analytics
- Pipeline conversion analytics: close rate by deal size, phase, referral source
- Effective hourly rate per engagement (actual hours ÷ revenue)
- Revenue forecasting (weighted pipeline + signed contracts → next 6 months)
- Runway (cash on hand ÷ burn)
- Time analytics: BD vs. client work vs. driving vs. admin ratios
- Cross-venture time allocation (Doula / PAZ / Vero / personal)

### Operational
- Win/loss log on every closed or dead deal, with reasons
- Follow-up enforcement: 24h post-meeting check that follow-up was sent
- Decision log with pattern recognition over time
- Goal tracker: quarterly objectives, weekly progress
- Subcontractor ledger: rates, quality, payment terms
- Meeting prep agent: morning briefing 15 min before each call (last comms, open items, deliverable status)
- Reusable artifacts library (link/index to existing Google Drive)

---

## Explicitly Out of Scope (do not build)
- Client health score / churn detection
- Supplier / CM database (defer)
- Lessons learned log (defer)
- Energy / focus tracking
- Client gift / touchpoint log
- Tax expense tagging
- 1099 / W9 tracking
- Native mobile app
- Multi-user / team features

---

## Tranche 2 Candidates

Features promoted from Tranche 2 consideration based on usage or design decisions made during Tranche 1 build.

- **Auto-extract deliverables from uploaded proposal files.** Use Claude API with document input. User reviews and approves extracted items before they're committed. Support PDF natively; convert PPT/PPTX to PDF first (LibreOffice headless or similar) then run the same pipeline. Same extraction pipeline can later pull SOW terms for scope-creep detection.

---

## Data Model (sketch — refine before building)

Core entities:
- `contact` — person
- `company` — org (client or prospect)
- `deal` — pipeline entry (company, stage, close window, size, source, next steps)
- `engagement` — active client project (company, phase, rate, weekly commitment)
- `proposal` — uploaded file + parsed deliverables, linked to engagement
- `deliverable` — line item, linked to proposal/engagement, status
- `hours_entry` — date, engagement, hours, type (BD/client/admin/driving)
- `contract` — file + metadata, linked to company
- `nda` — file + metadata, linked to company, expiration
- `calendar_event` — pulled from Google Cal, classification
- `financial_entry` — manual: revenue, cash, recurring cost, AR item
- `audit_log` — actor, action, entity, timestamp
- `brief` — generated Monday briefs, archived

Every client-data entity carries `client_id` for clean isolation/deletion.

---

## Build Order

1. Repo scaffold: Next.js + Drizzle + Postgres + Clerk + one CRUD route working end-to-end
2. Data model migrations
3. Manual entry UI for all Tranche 1 entities (ugly is fine)
4. Google Calendar OAuth + ingestion + classification
5. Export engine (`.xlsx` generation, both on-demand and scheduled)
6. Agent: nightly cron + Monday brief
7. Safety: backups, audit log, backup verification
8. Polish only what blocks daily use

---

## Style / Tone Notes for Generated Content

When the agent writes briefs or summaries:
- Lead with recommendation, then rationale, then 3 next actions
- Direct, no fluff, no fake enthusiasm, no therapy language
- Rank options over open-ended alternatives
- Challenge weak thinking, don't soften conclusions
- Apply engineering/product lens (BOM, DFM, tolerances, COGS, yield) and business lens (positioning, leverage, margins, pipeline) where relevant
