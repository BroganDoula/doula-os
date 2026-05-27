"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEngagement, updateEngagement } from "./actions";

const PHASE_OPTIONS = [
  { value: "definition",        label: "1 — Definition" },
  { value: "works_like",        label: "2 — Works-Like" },
  { value: "looks_works_like",  label: "3 — Looks-Works-Like" },
  { value: "design_package",    label: "4 — Design Package" },
  { value: "rfq",               label: "5 — RFQ" },
  { value: "manufacture",       label: "6 — Manufacture" },
];

type Company = { id: string; name: string };

type DefaultValues = {
  id: string;
  name: string;
  companyId: string;
  phase: string;
  status: string;
  rateCents: number | null;
  weeklyHourCommitment: number | null;
  startedAt: string | null;
  notes: string | null;
};

export function EngagementForm({
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
          await updateEngagement(formData);
        } else {
          await createEngagement(formData);
          ref.current?.reset();
        }
        onCancel?.();
      }}
      className="border rounded-lg p-4 space-y-4"
    >
      {isEdit && <input type="hidden" name="id" value={defaultValues.id} />}
      <h2 className="font-medium">{isEdit ? "Edit Project" : "New Project"}</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" required placeholder="Widget v2 Development" defaultValue={defaultValues?.name} />
        </div>
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
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1">
          <Label htmlFor="phase">Phase</Label>
          <select
            id="phase"
            name="phase"
            defaultValue={defaultValues?.phase ?? "definition"}
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
            defaultValue={defaultValues?.status ?? "active"}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="complete">Complete</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="rate">Rate ($/hr)</Label>
          <Input
            id="rate"
            name="rate"
            type="number"
            min="0"
            step="5"
            placeholder="150"
            defaultValue={defaultValues?.rateCents != null ? defaultValues.rateCents / 100 : ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="weeklyHours">Hrs/wk</Label>
          <Input
            id="weeklyHours"
            name="weeklyHours"
            type="number"
            min="0"
            step="1"
            placeholder="10"
            defaultValue={defaultValues?.weeklyHourCommitment ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1 w-1/4">
        <Label htmlFor="startedAt">Start Date</Label>
        <Input id="startedAt" name="startedAt" type="date" defaultValue={defaultValues?.startedAt ?? ""} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Scope, constraints, context…" defaultValue={defaultValues?.notes ?? ""} />
      </div>

      <div className="flex gap-2">
        <Button type="submit">{isEdit ? "Save" : "Add Project"}</Button>
        {isEdit && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
