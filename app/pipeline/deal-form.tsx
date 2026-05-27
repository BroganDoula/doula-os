"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDeal, updateDeal } from "./actions";

type Company = { id: string; name: string };
type Contact = { id: string; name: string; companyId: string | null };

type DefaultValues = {
  id: string;
  companyId: string;
  contactId: string | null;
  stage: string;
  closeWindowMonths: number | null;
  dealSizeCents: number | null;
  nextSteps: string | null;
  referralSource: string | null;
  notes: string | null;
};

const STAGE_LABELS: Record<string, string> = {
  prospect: "Prospect",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed — Won",
  closed_lost: "Closed — Lost",
};

export function DealForm({
  companies,
  contacts,
  defaultValues,
  onCancel,
}: {
  companies: Company[];
  contacts: Contact[];
  defaultValues?: DefaultValues;
  onCancel?: () => void;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const isEdit = !!defaultValues;
  const [selectedCompanyId, setSelectedCompanyId] = useState(defaultValues?.companyId ?? "");

  const filteredContacts = contacts.filter((c) => c.companyId === selectedCompanyId);

  return (
    <form
      ref={ref}
      action={async (formData) => {
        if (isEdit) {
          await updateDeal(formData);
        } else {
          await createDeal(formData);
          ref.current?.reset();
          setSelectedCompanyId("");
        }
        onCancel?.();
      }}
      className="border rounded-lg p-4 space-y-4"
    >
      {isEdit && <input type="hidden" name="id" value={defaultValues.id} />}
      <h2 className="font-medium">{isEdit ? "Edit Deal" : "New Deal"}</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="companyId">Company *</Label>
          <select
            id="companyId"
            name="companyId"
            required
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">Select company…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="contactId">Contact</Label>
          <select
            id="contactId"
            name="contactId"
            key={selectedCompanyId}
            disabled={!selectedCompanyId}
            defaultValue={defaultValues?.contactId ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background disabled:opacity-50"
          >
            <option value="">No contact</option>
            {filteredContacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label htmlFor="stage">Stage</Label>
          <select
            id="stage"
            name="stage"
            defaultValue={defaultValues?.stage ?? "prospect"}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            {Object.entries(STAGE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="closeWindowMonths">Close Window</Label>
          <select
            id="closeWindowMonths"
            name="closeWindowMonths"
            defaultValue={defaultValues?.closeWindowMonths?.toString() ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">Unknown</option>
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="9">9 months</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="dealSize">Deal Size ($)</Label>
          <Input
            id="dealSize"
            name="dealSize"
            type="number"
            min="0"
            step="100"
            placeholder="25000"
            defaultValue={defaultValues?.dealSizeCents != null ? defaultValues.dealSizeCents / 100 : ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="nextSteps">Next Steps</Label>
          <Input id="nextSteps" name="nextSteps" placeholder="Send proposal by Friday" defaultValue={defaultValues?.nextSteps ?? ""} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="referralSource">Referral Source</Label>
          <Input id="referralSource" name="referralSource" placeholder="John at Acme" defaultValue={defaultValues?.referralSource ?? ""} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Context, constraints, history…" defaultValue={defaultValues?.notes ?? ""} />
      </div>

      <div className="flex gap-2">
        <Button type="submit">{isEdit ? "Save" : "Add Deal"}</Button>
        {isEdit && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
