"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
              No deals yet.
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
                  <form action={deleteDeal}>
                    <input type="hidden" name="id" value={d.id} />
                    <Button variant="ghost" size="sm" type="submit">Delete</Button>
                  </form>
                </div>
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
}
