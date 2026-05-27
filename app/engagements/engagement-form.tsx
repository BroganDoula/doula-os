"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEngagement } from "./actions";

const PHASE_OPTIONS = [
  { value: 1, label: "1 — Definition" },
  { value: 2, label: "2 — Works-Like" },
  { value: 3, label: "3 — Looks-Works-Like" },
  { value: 4, label: "4 — Design Package" },
  { value: 5, label: "5 — RFQ" },
  { value: 6, label: "6 — Manufacture" },
];

type Company = { id: string; name: string };

export function EngagementForm({ companies }: { companies: Company[] }) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await createEngagement(formData);
        ref.current?.reset();
      }}
      className="border rounded-lg p-4 space-y-4"
    >
      <h2 className="font-medium">New Engagement</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" required placeholder="Widget v2 Development" />
        </div>
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
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1">
          <Label htmlFor="phase">Phase</Label>
          <select
            id="phase"
            name="phase"
            defaultValue={1}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            {PHASE_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue="active"
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="complete">Complete</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="rate">Rate ($/hr)</Label>
          <Input id="rate" name="rate" type="number" min="0" step="5" placeholder="150" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="weeklyHours">Hrs/wk</Label>
          <Input id="weeklyHours" name="weeklyHours" type="number" min="0" step="1" placeholder="10" />
        </div>
      </div>

      <div className="space-y-1 w-1/4">
        <Label htmlFor="startedAt">Start Date</Label>
        <Input id="startedAt" name="startedAt" type="date" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Scope, constraints, context…" />
      </div>

      <Button type="submit">Add Engagement</Button>
    </form>
  );
}
