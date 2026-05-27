"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  restoreCompany,
  restoreContact,
  restoreDeal,
  restoreEngagement,
  restoreDeliverable,
  restoreHoursEntry,
  restoreContract,
  restoreNda,
  restoreFinancialEntry,
} from "./restore-actions";

type ArchivedCompany = { id: string; name: string; website: string | null; deletedAt: string };
type ArchivedContact = { id: string; name: string; email: string | null; role: string | null; companyName: string | null; deletedAt: string };
type ArchivedDeal = { id: string; stage: string; dealSizeCents: number | null; companyName: string | null; deletedAt: string };
type ArchivedProject = { id: string; name: string; companyName: string | null; phase: string; status: string; deletedAt: string };
type ArchivedDeliverable = { id: string; title: string; status: string; engagementName: string | null; deletedAt: string };
type ArchivedHours = { id: string; date: string; hours: number; type: string; engagementName: string | null; deletedAt: string };
type ArchivedContract = { id: string; fileName: string; companyName: string | null; engagementName: string | null; signedDate: string | null; valueCents: number | null; deletedAt: string };
type ArchivedNda = { id: string; counterparty: string; companyName: string | null; signedDate: string | null; expirationDate: string | null; bidirectional: boolean; deletedAt: string };
type ArchivedFinancial = { id: string; type: string; description: string; amountCents: number; date: string; deletedAt: string };

const TABS = [
  { key: "companies",    label: "Companies" },
  { key: "contacts",     label: "Contacts" },
  { key: "deals",        label: "Leads" },
  { key: "projects",     label: "Projects" },
  { key: "deliverables", label: "Deliverables" },
  { key: "hours",        label: "Hours" },
  { key: "contracts",    label: "Contracts" },
  { key: "ndas",         label: "NDAs" },
  { key: "financials",   label: "Financials" },
] as const;

type TabKey = typeof TABS[number]["key"];

const PHASE_LABELS: Record<string, string> = {
  definition:       "1 — Definition",
  works_like:       "2 — Works-Like",
  looks_works_like: "3 — Looks-Works-Like",
  design_package:   "4 — Design Package",
  rfq:              "5 — RFQ",
  manufacture:      "6 — Manufacture",
};

const STAGE_LABELS: Record<string, string> = {
  prospect: "Prospect", qualified: "Qualified", proposal: "Proposal",
  negotiation: "Negotiation", closed_won: "Won", closed_lost: "Lost",
};

const HOURS_TYPE_LABELS: Record<string, string> = {
  client: "Client", bd: "BD", admin: "Admin", driving: "Driving",
};

const FINANCIAL_TYPE_LABELS: Record<string, string> = {
  revenue: "Revenue", cash_on_hand: "Cash on Hand",
  recurring_cost: "Recurring Cost", ar_item: "AR Item",
};

function formatDollars(cents: number | null) {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function formatTs(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function RestoreButton({ action, id }: { action: (fd: FormData) => Promise<void>; id: string }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Button variant="ghost" size="sm" type="submit">Restore</Button>
    </form>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr><td colSpan={colSpan} className="py-6 text-center text-muted-foreground">{label}</td></tr>
  );
}

export function ArchivedTabs({
  companies, contacts, deals, projects, deliverables, hours,
  contracts, ndas, financials,
}: {
  companies: ArchivedCompany[];
  contacts: ArchivedContact[];
  deals: ArchivedDeal[];
  projects: ArchivedProject[];
  deliverables: ArchivedDeliverable[];
  hours: ArchivedHours[];
  contracts: ArchivedContract[];
  ndas: ArchivedNda[];
  financials: ArchivedFinancial[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("companies");

  const counts: Record<TabKey, number> = {
    companies:    companies.length,
    contacts:     contacts.length,
    deals:        deals.length,
    projects:     projects.length,
    deliverables: deliverables.length,
    hours:        hours.length,
    contracts:    contracts.length,
    ndas:         ndas.length,
    financials:   financials.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-0.5 border-b flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "companies" && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Website</th>
              <th className="pb-2 font-medium">Archived</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 && <EmptyRow colSpan={4} label="No archived companies." />}
            {companies.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="py-2 font-medium">{c.name}</td>
                <td className="py-2 text-muted-foreground">{c.website ?? "—"}</td>
                <td className="py-2 text-muted-foreground text-xs">{formatTs(c.deletedAt)}</td>
                <td className="py-2 text-right"><RestoreButton action={restoreCompany} id={c.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "contacts" && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Company</th>
              <th className="pb-2 font-medium">Email</th>
              <th className="pb-2 font-medium">Role</th>
              <th className="pb-2 font-medium">Archived</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 && <EmptyRow colSpan={6} label="No archived contacts." />}
            {contacts.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="py-2 font-medium">{c.name}</td>
                <td className="py-2 text-muted-foreground">{c.companyName ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{c.email ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{c.role ?? "—"}</td>
                <td className="py-2 text-muted-foreground text-xs">{formatTs(c.deletedAt)}</td>
                <td className="py-2 text-right"><RestoreButton action={restoreContact} id={c.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "deals" && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Company</th>
              <th className="pb-2 font-medium">Stage</th>
              <th className="pb-2 font-medium">Size</th>
              <th className="pb-2 font-medium">Archived</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 && <EmptyRow colSpan={5} label="No archived leads." />}
            {deals.map((d) => (
              <tr key={d.id} className="border-b">
                <td className="py-2 font-medium">{d.companyName ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{STAGE_LABELS[d.stage] ?? d.stage}</td>
                <td className="py-2 text-muted-foreground">{formatDollars(d.dealSizeCents)}</td>
                <td className="py-2 text-muted-foreground text-xs">{formatTs(d.deletedAt)}</td>
                <td className="py-2 text-right"><RestoreButton action={restoreDeal} id={d.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "projects" && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Company</th>
              <th className="pb-2 font-medium">Phase</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Archived</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 && <EmptyRow colSpan={6} label="No archived projects." />}
            {projects.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2 font-medium">{p.name}</td>
                <td className="py-2 text-muted-foreground">{p.companyName ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{PHASE_LABELS[p.phase] ?? p.phase}</td>
                <td className="py-2 text-muted-foreground capitalize">{p.status}</td>
                <td className="py-2 text-muted-foreground text-xs">{formatTs(p.deletedAt)}</td>
                <td className="py-2 text-right"><RestoreButton action={restoreEngagement} id={p.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "deliverables" && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Title</th>
              <th className="pb-2 font-medium">Project</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Archived</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {deliverables.length === 0 && <EmptyRow colSpan={5} label="No archived deliverables." />}
            {deliverables.map((d) => (
              <tr key={d.id} className="border-b">
                <td className="py-2 font-medium">{d.title}</td>
                <td className="py-2 text-muted-foreground">
                  {d.engagementName
                    ? <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{d.engagementName}</span>
                    : "—"}
                </td>
                <td className="py-2 text-muted-foreground capitalize">{d.status.replace("_", " ")}</td>
                <td className="py-2 text-muted-foreground text-xs">{formatTs(d.deletedAt)}</td>
                <td className="py-2 text-right"><RestoreButton action={restoreDeliverable} id={d.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "hours" && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Project</th>
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium">Hours</th>
              <th className="pb-2 font-medium">Archived</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {hours.length === 0 && <EmptyRow colSpan={6} label="No archived hours entries." />}
            {hours.map((h) => (
              <tr key={h.id} className="border-b">
                <td className="py-2 text-muted-foreground tabular-nums">{h.date}</td>
                <td className="py-2 text-muted-foreground">
                  {h.engagementName
                    ? <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{h.engagementName}</span>
                    : "—"}
                </td>
                <td className="py-2 text-muted-foreground">{HOURS_TYPE_LABELS[h.type] ?? h.type}</td>
                <td className="py-2 font-medium tabular-nums">{h.hours.toFixed(1)}</td>
                <td className="py-2 text-muted-foreground text-xs">{formatTs(h.deletedAt)}</td>
                <td className="py-2 text-right"><RestoreButton action={restoreHoursEntry} id={h.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "contracts" && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">File</th>
              <th className="pb-2 font-medium">Company</th>
              <th className="pb-2 font-medium">Project</th>
              <th className="pb-2 font-medium">Signed</th>
              <th className="pb-2 font-medium">Value</th>
              <th className="pb-2 font-medium">Archived</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 && <EmptyRow colSpan={7} label="No archived contracts." />}
            {contracts.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="py-2">{c.fileName}</td>
                <td className="py-2 text-muted-foreground">{c.companyName ?? "—"}</td>
                <td className="py-2 text-muted-foreground">
                  {c.engagementName
                    ? <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.engagementName}</span>
                    : "—"}
                </td>
                <td className="py-2 text-muted-foreground">{c.signedDate ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{formatDollars(c.valueCents)}</td>
                <td className="py-2 text-muted-foreground text-xs">{formatTs(c.deletedAt)}</td>
                <td className="py-2 text-right"><RestoreButton action={restoreContract} id={c.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "ndas" && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Counterparty</th>
              <th className="pb-2 font-medium">Company</th>
              <th className="pb-2 font-medium">Signed</th>
              <th className="pb-2 font-medium">Expires</th>
              <th className="pb-2 font-medium">Mutual</th>
              <th className="pb-2 font-medium">Archived</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {ndas.length === 0 && <EmptyRow colSpan={7} label="No archived NDAs." />}
            {ndas.map((n) => (
              <tr key={n.id} className="border-b">
                <td className="py-2 font-medium">{n.counterparty}</td>
                <td className="py-2 text-muted-foreground">{n.companyName ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{n.signedDate ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{n.expirationDate ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{n.bidirectional ? "Yes" : "No"}</td>
                <td className="py-2 text-muted-foreground text-xs">{formatTs(n.deletedAt)}</td>
                <td className="py-2 text-right"><RestoreButton action={restoreNda} id={n.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "financials" && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium">Description</th>
              <th className="pb-2 font-medium">Amount</th>
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Archived</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {financials.length === 0 && <EmptyRow colSpan={6} label="No archived financial entries." />}
            {financials.map((f) => (
              <tr key={f.id} className="border-b">
                <td className="py-2 text-muted-foreground">{FINANCIAL_TYPE_LABELS[f.type] ?? f.type}</td>
                <td className="py-2">{f.description}</td>
                <td className="py-2 text-muted-foreground">{formatDollars(f.amountCents)}</td>
                <td className="py-2 text-muted-foreground">{f.date}</td>
                <td className="py-2 text-muted-foreground text-xs">{formatTs(f.deletedAt)}</td>
                <td className="py-2 text-right"><RestoreButton action={restoreFinancialEntry} id={f.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
