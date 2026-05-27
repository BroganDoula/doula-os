"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContractForm } from "./contract-form";
import { deleteContract } from "./actions";

type ContractRow = {
  id: string;
  companyId: string;
  engagementId: string | null;
  fileName: string;
  signedDate: string | null;
  termMonths: number | null;
  valueCents: number | null;
  notes: string | null;
  companyName: string | null;
  engagementName: string | null;
};

type Company = { id: string; name: string };
type Engagement = { id: string; name: string; companyId: string };

function formatDollars(cents: number | null) {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function ContractList({
  rows,
  companies,
  engagements,
}: {
  rows: ContractRow[];
  companies: Company[];
  engagements: Engagement[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="pb-2 font-medium">Company</th>
          <th className="pb-2 font-medium">File</th>
          <th className="pb-2 font-medium">Signed</th>
          <th className="pb-2 font-medium">Term</th>
          <th className="pb-2 font-medium">Value</th>
          <th className="pb-2" />
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={6} className="py-6 text-center text-muted-foreground">
              No contracts yet.
            </td>
          </tr>
        )}
        {rows.map((c) =>
          editingId === c.id ? (
            <tr key={c.id}>
              <td colSpan={6} className="py-2">
                <ContractForm
                  companies={companies}
                  engagements={engagements}
                  defaultValues={c}
                  onCancel={() => setEditingId(null)}
                />
              </td>
            </tr>
          ) : (
            <tr key={c.id} className="border-b">
              <td className="py-2 font-medium">{c.companyName ?? "—"}</td>
              <td className="py-2">
                <a
                  href={`/api/contracts/${c.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-foreground"
                >
                  {c.fileName}
                </a>
                {c.engagementName && (
                  <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {c.engagementName}
                  </span>
                )}
              </td>
              <td className="py-2 text-muted-foreground">{c.signedDate ?? "—"}</td>
              <td className="py-2 text-muted-foreground">
                {c.termMonths ? `${c.termMonths}mo` : "—"}
              </td>
              <td className="py-2 text-muted-foreground">{formatDollars(c.valueCents)}</td>
              <td className="py-2 text-right">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(c.id)}>Edit</Button>
                  <form action={deleteContract}>
                    <input type="hidden" name="id" value={c.id} />
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
