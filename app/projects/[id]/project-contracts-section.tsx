"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteConfirm } from "@/components/ui/delete-confirm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContractForm } from "@/app/contracts/contract-form";
import { createContract, deleteContract } from "@/app/contracts/actions";

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

function formatDollars(cents: number | null) {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function ProjectContractsSection({
  rows,
  companyId,
  companyName,
  engagementId,
  engagementName,
}: {
  rows: ContractRow[];
  companyId: string;
  companyName: string;
  engagementId: string;
  engagementName: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});

  // Single-item lists so ContractForm dropdowns are pre-locked to this project's company/engagement
  const companies = [{ id: companyId, name: companyName }];
  const engagements = [{ id: engagementId, name: engagementName, companyId }];

  return (
    <div className="space-y-3">
      {showUpload ? (
        <form
          ref={ref}
          action={async (formData) => {
            await createContract(formData);
            ref.current?.reset();
            setShowUpload(false);
          }}
          className="border rounded-lg p-4 space-y-4"
        >
          {/*
            Hidden fields tie this contract to the current project.
            Expected values at upload time:
              companyId    = engagement.companyId  (the client company UUID)
              engagementId = engagement.id         (this project's UUID)
          */}
          <input type="hidden" name="companyId" value={companyId} />
          <input type="hidden" name="engagementId" value={engagementId} />

          <h3 className="text-sm font-medium">Upload Contract</h3>

          <div className="space-y-1">
            <Label htmlFor="proj-file">File *</Label>
            <input
              id="proj-file"
              name="file"
              type="file"
              accept=".pdf,.doc,.docx"
              required
              className="w-full text-sm file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="proj-signedDate">Signed Date</Label>
              <Input id="proj-signedDate" name="signedDate" type="date" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="proj-termMonths">Term (months)</Label>
              <Input id="proj-termMonths" name="termMonths" type="number" min="1" step="1" placeholder="12" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="proj-value">Value ($)</Label>
              <Input id="proj-value" name="value" type="number" min="0" step="100" placeholder="50000" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="proj-notes">Notes</Label>
            <Input id="proj-notes" name="notes" placeholder="Scope, payment terms…" />
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm">Upload</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
          + Upload Contract
        </Button>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
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
              <td colSpan={5} className="py-6 text-center text-muted-foreground">
                No contracts linked to this project.
              </td>
            </tr>
          )}
          {rows.map((c) =>
            editingId === c.id ? (
              <tr key={c.id}>
                <td colSpan={5} className="py-2">
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
                <td className="py-2">
                  <a
                    href={`/api/contracts/${c.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {c.fileName}
                  </a>
                </td>
                <td className="py-2 text-muted-foreground">{c.signedDate ?? "—"}</td>
                <td className="py-2 text-muted-foreground">
                  {c.termMonths ? `${c.termMonths}mo` : "—"}
                </td>
                <td className="py-2 text-muted-foreground">{formatDollars(c.valueCents)}</td>
                <td className="py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(c.id)}>
                      Edit
                    </Button>
                    <DeleteConfirm
                      title="Delete contract?"
                      description={`This will hide ${c.fileName}. You can restore it from the Archived view.`}
                      onConfirm={async () => {
                        setDeleteErrors((prev) => { const n = { ...prev }; delete n[c.id]; return n; });
                        const fd = new FormData();
                        fd.append("id", c.id);
                        fd.append("engagementId", engagementId);
                        const res = await deleteContract(fd);
                        if (res?.error) setDeleteErrors((prev) => ({ ...prev, [c.id]: res.error }));
                      }}
                    />
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
    </div>
  );
}
