"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EngagementForm } from "./engagement-form";
import { deleteEngagement } from "./actions";

type EngagementRow = {
  id: string;
  name: string;
  phase: string;
  status: string;
  rateCents: number | null;
  weeklyHourCommitment: number | null;
  companyId: string;
  companyName: string | null;
  startedAt: string | null;
  notes: string | null;
};

type Company = { id: string; name: string };

const PHASE_LABELS: Record<string, string> = {
  definition:       "1 — Definition",
  works_like:       "2 — Works-Like",
  looks_works_like: "3 — Looks-Works-Like",
  design_package:   "4 — Design Package",
  rfq:              "5 — RFQ",
  manufacture:      "6 — Manufacture",
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-green-600",
  paused: "text-yellow-600",
  complete: "text-muted-foreground",
};

export function EngagementList({
  rows,
  companies,
}: {
  rows: EngagementRow[];
  companies: Company[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="pb-2 font-medium">Name</th>
          <th className="pb-2 font-medium">Company</th>
          <th className="pb-2 font-medium">Phase</th>
          <th className="pb-2 font-medium">Status</th>
          <th className="pb-2 font-medium">Rate/hr</th>
          <th className="pb-2 font-medium">Hrs/wk</th>
          <th className="pb-2" />
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={7} className="py-6 text-center text-muted-foreground">
              No projects yet.
            </td>
          </tr>
        )}
        {rows.map((e) =>
          editingId === e.id ? (
            <tr key={e.id}>
              <td colSpan={7} className="py-2">
                <EngagementForm
                  companies={companies}
                  defaultValues={e}
                  onCancel={() => setEditingId(null)}
                />
              </td>
            </tr>
          ) : (
            <tr key={e.id} className="border-b">
              <td className="py-2 font-medium">
                <Link href={`/projects/${e.id}`} className="hover:underline">{e.name}</Link>
              </td>
              <td className="py-2 text-muted-foreground">{e.companyName ?? "—"}</td>
              <td className="py-2 text-muted-foreground">{PHASE_LABELS[e.phase] ?? e.phase}</td>
              <td className={`py-2 font-medium capitalize ${STATUS_COLORS[e.status] ?? ""}`}>
                {e.status}
              </td>
              <td className="py-2 text-muted-foreground">
                {e.rateCents ? `$${(e.rateCents / 100).toLocaleString()}` : "—"}
              </td>
              <td className="py-2 text-muted-foreground">{e.weeklyHourCommitment ?? "—"}</td>
              <td className="py-2 text-right">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(e.id)}>Edit</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      setDeleteErrors((prev) => { const n = { ...prev }; delete n[e.id]; return n; });
                      const fd = new FormData();
                      fd.append("id", e.id);
                      const res = await deleteEngagement(fd);
                      if (res?.error) setDeleteErrors((prev) => ({ ...prev, [e.id]: res.error }));
                    }}
                  >Delete</Button>
                </div>
                {deleteErrors[e.id] && (
                  <p className="text-xs text-red-500 mt-1 text-right">{deleteErrors[e.id]}</p>
                )}
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
}
