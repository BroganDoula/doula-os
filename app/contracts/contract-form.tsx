"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createContract, updateContract } from "./actions";

type Company = { id: string; name: string };

type DefaultValues = {
  id: string;
  companyId: string;
  fileName: string;
  signedDate: string | null;
  termMonths: number | null;
  valueCents: number | null;
  notes: string | null;
};

export function ContractForm({
  companies,
  defaultValues,
  onCancel,
}: {
  companies: Company[];
  defaultValues?: DefaultValues;
  onCancel?: () => void;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const isEdit = !!defaultValues;

  return (
    <form
      ref={ref}
      action={async (formData) => {
        if (isEdit) {
          await updateContract(formData);
        } else {
          await createContract(formData);
          ref.current?.reset();
        }
        onCancel?.();
      }}
      className="border rounded-lg p-4 space-y-4"
    >
      {isEdit && <input type="hidden" name="id" value={defaultValues.id} />}
      <h2 className="font-medium">{isEdit ? "Edit Contract" : "New Contract"}</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="companyId">Company *</Label>
          <select
            id="companyId"
            name="companyId"
            required
            defaultValue={defaultValues?.companyId ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">Select company…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="file">{isEdit ? "Replace PDF (optional)" : "PDF File *"}</Label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".pdf"
            required={!isEdit}
            className="w-full text-sm file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium cursor-pointer"
          />
          {isEdit && (
            <p className="text-xs text-muted-foreground">Current: {defaultValues.fileName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label htmlFor="signedDate">Signed Date</Label>
          <Input
            id="signedDate"
            name="signedDate"
            type="date"
            defaultValue={defaultValues?.signedDate ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="termMonths">Term (months)</Label>
          <Input
            id="termMonths"
            name="termMonths"
            type="number"
            min="1"
            step="1"
            placeholder="12"
            defaultValue={defaultValues?.termMonths ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="value">Value ($)</Label>
          <Input
            id="value"
            name="value"
            type="number"
            min="0"
            step="100"
            placeholder="50000"
            defaultValue={defaultValues?.valueCents != null ? defaultValues.valueCents / 100 : ""}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Scope, payment terms, renewal conditions…"
          defaultValue={defaultValues?.notes ?? ""}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">{isEdit ? "Save" : "Add Contract"}</Button>
        {isEdit && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
