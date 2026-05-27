"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteConfirm } from "@/components/ui/delete-confirm";
import { NdaForm } from "./nda-form";
import { deleteNda } from "./actions";

type NdaRow = {
  id: string;
  counterparty: string;
  companyId: string | null;
  engagementId: string | null;
  fileName: string | null;
  signedDate: string | null;
  expirationDate: string | null;
  bidirectional: boolean;
  notes: string | null;
  companyName: string | null;
  engagementName: string | null;
};

type Company = { id: string; name: string };
type Engagement = { id: string; name: string; companyId: string };

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function ExpirationCell({ dateStr }: { dateStr: string | null }) {
  if (!dateStr) return <span className="text-muted-foreground">—</span>;
  const days = daysUntil(dateStr);
  if (days === null) return <span className="text-muted-foreground">{dateStr}</span>;
  if (days <= 0) return <span className="text-red-600 font-medium">{dateStr} (expired)</span>;
  if (days <= 60) return <span className="text-amber-600 font-medium">{dateStr} ({days}d)</span>;
  return <span className="text-muted-foreground">{dateStr}</span>;
}

export function NdaList({
  rows,
  companies,
  engagements,
}: {
  rows: NdaRow[];
  companies: Company[];
  engagements: Engagement[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="pb-2 font-medium">Counterparty</th>
          <th className="pb-2 font-medium">Company</th>
          <th className="pb-2 font-medium">Signed</th>
          <th className="pb-2 font-medium">Expires</th>
          <th className="pb-2 font-medium">Mutual</th>
          <th className="pb-2 font-medium">File</th>
          <th className="pb-2" />
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={7} className="py-6 text-center text-muted-foreground">
              No NDAs yet.
            </td>
          </tr>
        )}
        {rows.map((n) =>
          editingId === n.id ? (
            <tr key={n.id}>
              <td colSpan={7} className="py-2">
                <NdaForm
                  companies={companies}
                  engagements={engagements}
                  defaultValues={n}
                  onCancel={() => setEditingId(null)}
                />
              </td>
            </tr>
          ) : (
            <tr key={n.id} className="border-b">
              <td className="py-2 font-medium">{n.counterparty}</td>
              <td className="py-2 text-muted-foreground">
                {n.companyName ? (
                  <span>
                    {n.companyName}
                    {n.engagementName && (
                      <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                        {n.engagementName}
                      </span>
                    )}
                  </span>
                ) : "—"}
              </td>
              <td className="py-2 text-muted-foreground">{n.signedDate ?? "—"}</td>
              <td className="py-2">
                <ExpirationCell dateStr={n.expirationDate} />
              </td>
              <td className="py-2 text-muted-foreground">{n.bidirectional ? "Yes" : "No"}</td>
              <td className="py-2 text-muted-foreground">
                {n.fileName ? (
                  <a
                    href={`/api/ndas/${n.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline text-foreground"
                  >
                    {n.fileName}
                  </a>
                ) : "—"}
              </td>
              <td className="py-2 text-right">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(n.id)}>Edit</Button>
                  <DeleteConfirm
                    title="Delete NDA?"
                    description={`This will hide the ${n.counterparty} NDA. You can restore it from the Archived view.`}
                    onConfirm={async () => {
                      setDeleteErrors((prev) => { const next = { ...prev }; delete next[n.id]; return next; });
                      const fd = new FormData();
                      fd.append("id", n.id);
                      const res = await deleteNda(fd);
                      if (res?.error) setDeleteErrors((prev) => ({ ...prev, [n.id]: res.error }));
                    }}
                  />
                </div>
                {deleteErrors[n.id] && (
                  <p className="text-xs text-red-500 mt-1 text-right">{deleteErrors[n.id]}</p>
                )}
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
}
