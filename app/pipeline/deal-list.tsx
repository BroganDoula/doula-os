"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteConfirm } from "@/components/ui/delete-confirm";
import { DealForm } from "./deal-form";
import { deleteDeal } from "./actions";

type DealRow = {
  id: string;
  companyId: string;
  contactId: string | null;
  stage: string;
  closeWindowMonths: number | null;
  dealSizeCents: number | null;
  nextSteps: string | null;
  referralSource: string | null;
  notes: string | null;
  companyName: string | null;
  contactName: string | null;
};

type Company = { id: string; name: string };
type Contact = { id: string; name: string; companyId: string | null };

const STAGE_LABELS: Record<string, string> = {
  prospect: "Prospect",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Won",
  closed_lost: "Lost",
};

const STAGE_COLORS: Record<string, string> = {
  prospect: "text-muted-foreground",
  qualified: "text-blue-600",
  proposal: "text-yellow-600",
  negotiation: "text-orange-600",
  closed_won: "text-green-600",
  closed_lost: "text-red-500",
};

function formatDollars(cents: number | null) {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export function DealList({
  rows,
  companies,
  contacts,
}: {
  rows: DealRow[];
  companies: Company[];
  contacts: Contact[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="pb-2 font-medium">Company</th>
          <th className="pb-2 font-medium">Contact</th>
          <th className="pb-2 font-medium">Stage</th>
          <th className="pb-2 font-medium">Close</th>
          <th className="pb-2 font-medium">Size</th>
          <th className="pb-2 font-medium">Next Steps</th>
          <th className="pb-2 font-medium">Source</th>
          <th className="pb-2" />
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={8} className="py-6 text-center text-muted-foreground">
              No leads yet.
            </td>
          </tr>
        )}
        {rows.map((d) =>
          editingId === d.id ? (
            <tr key={d.id}>
              <td colSpan={8} className="py-2">
                <DealForm
                  companies={companies}
                  contacts={contacts}
                  defaultValues={d}
                  onCancel={() => setEditingId(null)}
                />
              </td>
            </tr>
          ) : (
            <tr key={d.id} className="border-b">
              <td className="py-2 font-medium">{d.companyName ?? "—"}</td>
              <td className="py-2 text-muted-foreground">{d.contactName ?? "—"}</td>
              <td className={`py-2 font-medium ${STAGE_COLORS[d.stage] ?? ""}`}>
                {STAGE_LABELS[d.stage] ?? d.stage}
              </td>
              <td className="py-2 text-muted-foreground">
                {d.closeWindowMonths ? `${d.closeWindowMonths}mo` : "—"}
              </td>
              <td className="py-2 text-muted-foreground">{formatDollars(d.dealSizeCents)}</td>
              <td className="py-2 text-muted-foreground max-w-xs truncate">{d.nextSteps ?? "—"}</td>
              <td className="py-2 text-muted-foreground">{d.referralSource ?? "—"}</td>
              <td className="py-2 text-right">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(d.id)}>Edit</Button>
                  <DeleteConfirm
                    title="Archive lead?"
                    description={`This will hide this lead${d.companyName ? ` — ${d.companyName}` : ""}. You can restore it from the Archived view.`}
                    onConfirm={async () => {
                      setDeleteErrors((prev) => { const n = { ...prev }; delete n[d.id]; return n; });
                      const fd = new FormData();
                      fd.append("id", d.id);
                      const res = await deleteDeal(fd);
                      if (res?.error) setDeleteErrors((prev) => ({ ...prev, [d.id]: res.error }));
                    }}
                  />
                </div>
                {deleteErrors[d.id] && (
                  <p className="text-xs text-red-500 mt-1 text-right">{deleteErrors[d.id]}</p>
                )}
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
}
