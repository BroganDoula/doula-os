"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteConfirm } from "@/components/ui/delete-confirm";
import { EntryForm, type EntryType } from "./entry-form";
import { deleteFinancialEntry, markArPaid } from "./actions";

export type EntryRow = {
  id: string;
  type: EntryType;
  clientId: string | null;
  description: string;
  amountCents: number;
  date: string;
  dueDate: string | null;
  paidAt: string | null;
  recurringPeriod: string | null;
  notes: string | null;
  clientName: string | null;
};

type Company = { id: string; name: string };

const PERIOD_LABELS: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
  one_time: "One-time",
};

function formatDollars(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function monthlyEquiv(cents: number, period: string | null): string {
  if (period === "monthly") return formatDollars(cents);
  if (period === "quarterly") return `${formatDollars(Math.round(cents / 3))}/mo`;
  if (period === "annual") return `${formatDollars(Math.round(cents / 12))}/mo`;
  return "—";
}

function ArStatusBadge({ dueDate, paidAt }: { dueDate: string | null; paidAt: string | null }) {
  if (paidAt) {
    return <span className="text-green-600 text-xs font-medium">Paid {paidAt}</span>;
  }
  if (!dueDate) {
    return <span className="text-muted-foreground text-xs">Outstanding</span>;
  }
  const today = new Date().toISOString().split("T")[0];
  if (dueDate < today) {
    return <span className="text-red-600 text-xs font-medium">Overdue (due {dueDate})</span>;
  }
  return <span className="text-amber-600 text-xs">Due {dueDate}</span>;
}

export function EntryList({
  type,
  rows,
  companies,
}: {
  type: EntryType;
  rows: EntryRow[];
  companies: Company[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});

  const emptyLabel =
    type === "revenue" ? "No revenue entries yet." :
    type === "cash_on_hand" ? "No cash snapshots yet." :
    type === "recurring_cost" ? "No recurring costs yet." :
    "No AR items yet.";

  const colSpan =
    type === "revenue" ? 5 :
    type === "cash_on_hand" ? 4 :
    type === "recurring_cost" ? 6 :
    7;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          {type === "revenue" && <>
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium">Client</th>
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 font-medium">Amount</th>
            <th className="pb-2" />
          </>}
          {type === "cash_on_hand" && <>
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium">Account</th>
            <th className="pb-2 font-medium">Balance</th>
            <th className="pb-2" />
          </>}
          {type === "recurring_cost" && <>
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 font-medium">Period</th>
            <th className="pb-2 font-medium">Amount</th>
            <th className="pb-2 font-medium">$/mo equiv</th>
            <th className="pb-2 font-medium">Notes</th>
            <th className="pb-2" />
          </>}
          {type === "ar_item" && <>
            <th className="pb-2 font-medium">Client</th>
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 font-medium">Sent</th>
            <th className="pb-2 font-medium">Amount</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Due</th>
            <th className="pb-2" />
          </>}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={colSpan} className="py-6 text-center text-muted-foreground">
              {emptyLabel}
            </td>
          </tr>
        )}
        {rows.map((r) =>
          editingId === r.id ? (
            <tr key={r.id}>
              <td colSpan={colSpan} className="py-2">
                <EntryForm
                  type={type}
                  companies={companies}
                  defaultValues={r}
                  onCancel={() => setEditingId(null)}
                />
              </td>
            </tr>
          ) : (
            <tr key={r.id} className="border-b">
              {type === "revenue" && <>
                <td className="py-2 text-muted-foreground">{r.date}</td>
                <td className="py-2 text-muted-foreground">{r.clientName ?? "—"}</td>
                <td className="py-2">{r.description}</td>
                <td className="py-2 font-medium">{formatDollars(r.amountCents)}</td>
              </>}
              {type === "cash_on_hand" && <>
                <td className="py-2 text-muted-foreground">{r.date}</td>
                <td className="py-2">{r.description}</td>
                <td className="py-2 font-medium">{formatDollars(r.amountCents)}</td>
              </>}
              {type === "recurring_cost" && <>
                <td className="py-2 font-medium">{r.description}</td>
                <td className="py-2 text-muted-foreground">{PERIOD_LABELS[r.recurringPeriod ?? ""] ?? "—"}</td>
                <td className="py-2">{formatDollars(r.amountCents)}</td>
                <td className="py-2 text-muted-foreground">{monthlyEquiv(r.amountCents, r.recurringPeriod)}</td>
                <td className="py-2 text-muted-foreground max-w-xs truncate">{r.notes ?? "—"}</td>
              </>}
              {type === "ar_item" && <>
                <td className="py-2 text-muted-foreground">{r.clientName ?? "—"}</td>
                <td className="py-2">{r.description}</td>
                <td className="py-2 text-muted-foreground">{r.date}</td>
                <td className="py-2 font-medium">{formatDollars(r.amountCents)}</td>
                <td className="py-2"><ArStatusBadge dueDate={r.dueDate} paidAt={r.paidAt} /></td>
                <td className="py-2 text-muted-foreground">{r.dueDate ?? "—"}</td>
              </>}
              <td className="py-2 text-right">
                <div className="flex gap-1 justify-end flex-wrap">
                  {type === "ar_item" && !r.paidAt && (
                    <form action={markArPaid}>
                      <input type="hidden" name="id" value={r.id} />
                      <Button variant="ghost" size="sm" type="submit" className="text-green-700">
                        Mark Paid
                      </Button>
                    </form>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(r.id)}>Edit</Button>
                  <DeleteConfirm
                    title="Delete entry?"
                    description={`This will hide "${r.description}" (${formatDollars(r.amountCents)}). You can restore it from the Archived view.`}
                    onConfirm={async () => {
                      setDeleteErrors((prev) => { const n = { ...prev }; delete n[r.id]; return n; });
                      const fd = new FormData();
                      fd.append("id", r.id);
                      const res = await deleteFinancialEntry(fd);
                      if (res?.error) setDeleteErrors((prev) => ({ ...prev, [r.id]: res.error }));
                    }}
                  />
                </div>
                {deleteErrors[r.id] && (
                  <p className="text-xs text-red-500 mt-1 text-right">{deleteErrors[r.id]}</p>
                )}
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
}
