"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createNda, updateNda } from "./actions";

type Company = { id: string; name: string };
type Engagement = { id: string; name: string; companyId: string };

type DefaultValues = {
  id: string;
  counterparty: string;
  companyId: string | null;
  engagementId: string | null;
  fileName: string | null;
  signedDate: string | null;
  expirationDate: string | null;
  bidirectional: boolean;
  notes: string | null;
};

export function NdaForm({
  companies,
  engagements,
  defaultValues,
  onCancel,
}: {
  companies: Company[];
  engagements: Engagement[];
  defaultValues?: DefaultValues;
  onCancel?: () => void;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const isEdit = !!defaultValues;
  const [selectedCompanyId, setSelectedCompanyId] = useState(defaultValues?.companyId ?? "");

  const filteredEngagements = engagements.filter((e) => e.companyId === selectedCompanyId);

  return (
    <form
      ref={ref}
      action={async (formData) => {
        if (isEdit) {
          await updateNda(formData);
        } else {
          await createNda(formData);
          ref.current?.reset();
          setSelectedCompanyId("");
        }
        onCancel?.();
      }}
      className="border rounded-lg p-4 space-y-4"
    >
      {isEdit && <input type="hidden" name="id" value={defaultValues.id} />}
      <h2 className="font-medium">{isEdit ? "Edit NDA" : "New NDA"}</h2>

      <div className="space-y-1">
        <Label htmlFor="counterparty">Counterparty *</Label>
        <Input
          id="counterparty"
          name="counterparty"
          required
          placeholder="Acme Corp"
          defaultValue={defaultValues?.counterparty ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="companyId">Company (optional)</Label>
          <select
            id="companyId"
            name="companyId"
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">None</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="engagementId">Linked Project (optional)</Label>
          <select
            id="engagementId"
            name="engagementId"
            key={selectedCompanyId}
            disabled={!selectedCompanyId}
            defaultValue={defaultValues?.engagementId ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background disabled:opacity-50"
          >
            <option value="">None</option>
            {filteredEngagements.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor="expirationDate">Expiration Date</Label>
          <Input
            id="expirationDate"
            name="expirationDate"
            type="date"
            defaultValue={defaultValues?.expirationDate ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="file">{isEdit ? "Replace file (optional)" : "File (optional)"}</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.doc,.docx"
          className="w-full text-sm file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium cursor-pointer"
        />
        {isEdit && defaultValues.fileName && (
          <p className="text-xs text-muted-foreground">Current: {defaultValues.fileName}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="bidirectional"
          name="bidirectional"
          type="checkbox"
          value="true"
          defaultChecked={defaultValues?.bidirectional ?? false}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="bidirectional" className="font-normal cursor-pointer">
          Mutual / bidirectional NDA
        </Label>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Scope, special terms, renewal conditions…"
          defaultValue={defaultValues?.notes ?? ""}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">{isEdit ? "Save" : "Add NDA"}</Button>
        {isEdit && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
