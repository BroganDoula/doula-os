"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDeal } from "./actions";

type Company = { id: string; name: string };
type Contact = { id: string; name: string; companyId: string | null };

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
}: {
  companies: Company[];
  contacts: Contact[];
}) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await createDeal(formData);
        ref.current?.reset();
      }}
      className="border rounded-lg p-4 space-y-4"
    >
      <h2 className="font-medium">New Deal</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="companyId">Company *</Label>
          <select
            id="companyId"
            name="companyId"
            required
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">Select company…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="contactId">Contact</Label>
          <select
            id="contactId"
            name="contactId"
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">No contact</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
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
            defaultValue="prospect"
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            {Object.entries(STAGE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="closeWindowMonths">Close Window</Label>
          <select
            id="closeWindowMonths"
            name="closeWindowMonths"
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
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="nextSteps">Next Steps</Label>
          <Input id="nextSteps" name="nextSteps" placeholder="Send proposal by Friday" />
        </div>

        <div className="space-y-1">
          <Label htmlFor="referralSource">Referral Source</Label>
          <Input id="referralSource" name="referralSource" placeholder="John at Acme" />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Context, constraints, history…" />
      </div>

      <Button type="submit">Add Deal</Button>
    </form>
  );
}
