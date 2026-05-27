"use client";

import { useState } from "react";
import { EntryForm, type EntryType } from "./entry-form";
import { EntryList, type EntryRow } from "./entry-list";

type Company = { id: string; name: string };

const TABS: { key: EntryType; label: string }[] = [
  { key: "revenue", label: "Revenue" },
  { key: "cash_on_hand", label: "Cash on Hand" },
  { key: "recurring_cost", label: "Recurring Costs" },
  { key: "ar_item", label: "AR / Invoices" },
];

export function FinancialTabs({
  revenueRows,
  cashRows,
  recurringRows,
  arRows,
  companies,
}: {
  revenueRows: EntryRow[];
  cashRows: EntryRow[];
  recurringRows: EntryRow[];
  arRows: EntryRow[];
  companies: Company[];
}) {
  const [activeTab, setActiveTab] = useState<EntryType>("revenue");

  const rowsMap: Record<EntryType, EntryRow[]> = {
    revenue: revenueRows,
    cash_on_hand: cashRows,
    recurring_cost: recurringRows,
    ar_item: arRows,
  };

  return (
    <div className="space-y-6">
      {/* Tab bar */}
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
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <EntryForm type={activeTab} companies={companies} />
      <EntryList type={activeTab} rows={rowsMap[activeTab]} companies={companies} />
    </div>
  );
}
