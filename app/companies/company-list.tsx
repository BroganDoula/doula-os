"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CompanyForm } from "./company-form";
import { deleteCompany } from "./actions";
import type { Company } from "@/db/schema";

export function CompanyList({ rows }: { rows: Company[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="pb-2 font-medium">Name</th>
          <th className="pb-2 font-medium">Website</th>
          <th className="pb-2 font-medium">Notes</th>
          <th className="pb-2" />
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={4} className="py-6 text-center text-muted-foreground">
              No companies yet.
            </td>
          </tr>
        )}
        {rows.map((c) =>
          editingId === c.id ? (
            <tr key={c.id}>
              <td colSpan={4} className="py-2">
                <CompanyForm defaultValues={c} onCancel={() => setEditingId(null)} />
              </td>
            </tr>
          ) : (
            <tr key={c.id} className="border-b">
              <td className="py-2 font-medium">
                <Link href={`/companies/${c.id}`} className="hover:underline">{c.name}</Link>
              </td>
              <td className="py-2 text-muted-foreground">{c.website ?? "—"}</td>
              <td className="py-2 text-muted-foreground max-w-xs truncate">{c.notes ?? "—"}</td>
              <td className="py-2 text-right">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(c.id)}>Edit</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      setDeleteErrors((prev) => { const n = { ...prev }; delete n[c.id]; return n; });
                      const fd = new FormData();
                      fd.append("id", c.id);
                      const res = await deleteCompany(fd);
                      if (res?.error) setDeleteErrors((prev) => ({ ...prev, [c.id]: res.error }));
                    }}
                  >Delete</Button>
                </div>
                {deleteErrors[c.id] && (
                  <p className="text-xs text-red-500 mt-1 text-right">{deleteErrors[c.id]}</p>
                )}
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
}
