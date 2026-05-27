"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  restoreContract,
  restoreNda,
  restoreEngagement,
  restoreFinancialEntry,
} from "./restore-actions";

type ArchivedContract = {
  id: string;
  fileName: string;
  companyName: string | null;
  engagementName: string | null;
  signedDate: string | null;
  valueCents: number | null;
  deletedAt: string;
};

type ArchivedNda = {
  id: string;
  counterparty: string;
  companyName: string | null;
  signedDate: string | null;
  expirationDate: string | null;
  bidirectional: boolean;
  deletedAt: string;
};

type ArchivedProject = {
  id: string;
  name: string;
  companyName: string | null;
  phase: string;
  status: string;
  deletedAt: string;
};

type ArchivedFinancial = {
  id: string;
  type: string;
  description: string;
  amountCents: number;
  date: string;
  deletedAt: string;
};

const TABS = [
  { key: "contracts", label: "Contracts" },
  { key: "ndas", label: "NDAs" },
  { key: "projects", label: "Projects" },
  { key: "financials", label: "Financial Entries" },
] as const;

type TabKey = typeof TABS[number]["key"];

const PHASE_LABELS: Record<string, string> = {
  definition: "1 — Definition",
  works_like: "2 — Works-Like",
  looks_works_like: "3 — Looks-Works-Like",
  design_package: "4 — Design Package",
  rfq: "5 — RFQ",
  manufacture: "6 — Manufacture",
};

const TYPE_LABELS: Record<string, string> = {
  revenue: "Revenue",
  cash_on_hand: "Cash on Hand",
  recurring_cost: "Recurring Cost",
  ar_item: "AR Item",
};

function formatDollars(cents: number | null) {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function formatTs(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ArchivedTabs({
  contracts,
  ndas,
  projects,
  financials,
}: {
  contracts: ArchivedContract[];
  ndas: ArchivedNda[];
  projects: ArchivedProject[];
  financials: ArchivedFinancial[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("contracts");

  const counts: Record<TabKey, number> = {
    contracts: contracts.length,
    ndas: ndas.length,
    projects: projects.length,
    financials: financials.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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

      {activeTab === "contracts" && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">File</th>
              <th className="pb-2 font-medium">Company</th>
              <th className="pb-2 font-medium">Project</th>
              <th className="pb-2 font-medium">Signed</th>
              <th className="pb-2 font-medium">Value</th>
              <th className="pb-2 font-medium">Deleted</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No archived contracts.</td></tr>
            )}
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
                <td className="py-2 text-right">
                  <form action={restoreContract}>
                    <input type="hidden" name="id" value={c.id} />
                    <Button variant="ghost" size="sm" type="submit">Restore</Button>
                  </form>
                </td>
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
              <th className="pb-2 font-medium">Deleted</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {ndas.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No archived NDAs.</td></tr>
            )}
            {ndas.map((n) => (
              <tr key={n.id} className="border-b">
                <td className="py-2 font-medium">{n.counterparty}</td>
                <td className="py-2 text-muted-foreground">{n.companyName ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{n.signedDate ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{n.expirationDate ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{n.bidirectional ? "Yes" : "No"}</td>
                <td className="py-2 text-muted-foreground text-xs">{formatTs(n.deletedAt)}</td>
                <td className="py-2 text-right">
                  <form action={restoreNda}>
                    <input type="hidden" name="id" value={n.id} />
                    <Button variant="ghost" size="sm" type="submit">Restore</Button>
                  </form>
                </td>
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
              <th className="pb-2 font-medium">Deleted</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No archived projects.</td></tr>
            )}
            {projects.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2 font-medium">{p.name}</td>
                <td className="py-2 text-muted-foreground">{p.companyName ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{PHASE_LABELS[p.phase] ?? p.phase}</td>
                <td className="py-2 text-muted-foreground capitalize">{p.status}</td>
                <td className="py-2 text-muted-foreground text-xs">{formatTs(p.deletedAt)}</td>
                <td className="py-2 text-right">
                  <form action={restoreEngagement}>
                    <input type="hidden" name="id" value={p.id} />
                    <Button variant="ghost" size="sm" type="submit">Restore</Button>
                  </form>
                </td>
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
              <th className="pb-2 font-medium">Deleted</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {financials.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No archived financial entries.</td></tr>
            )}
            {financials.map((f) => (
              <tr key={f.id} className="border-b">
                <td className="py-2 text-muted-foreground">{TYPE_LABELS[f.type] ?? f.type}</td>
                <td className="py-2">{f.description}</td>
                <td className="py-2 text-muted-foreground">{formatDollars(f.amountCents)}</td>
                <td className="py-2 text-muted-foreground">{f.date}</td>
                <td className="py-2 text-muted-foreground text-xs">{formatTs(f.deletedAt)}</td>
                <td className="py-2 text-right">
                  <form action={restoreFinancialEntry}>
                    <input type="hidden" name="id" value={f.id} />
                    <Button variant="ghost" size="sm" type="submit">Restore</Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
