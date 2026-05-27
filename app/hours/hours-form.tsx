"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createHoursEntry, updateHoursEntry } from "./actions";

const TYPE_OPTIONS = [
  { value: "client", label: "Client Work" },
  { value: "bd", label: "BD" },
  { value: "admin", label: "Admin" },
  { value: "driving", label: "Driving" },
];

type Engagement = { id: string; name: string };

type DefaultValues = {
  id: string;
  date: string;
  hours: number;
  type: string;
  engagementId: string | null;
  notes: string | null;
};

export function HoursForm({
  engagements,
  today,
  defaultValues,
  onCancel,
}: {
  engagements: Engagement[];
  today: string;
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
          await updateHoursEntry(formData);
        } else {
          await createHoursEntry(formData);
          ref.current?.reset();
        }
        onCancel?.();
      }}
      className="border rounded-lg p-4 space-y-4"
    >
      {isEdit && <input type="hidden" name="id" value={defaultValues.id} />}
      <h2 className="font-medium">{isEdit ? "Edit Entry" : "Log Hours"}</h2>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaultValues?.date ?? today}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="engagementId">Project</Label>
          <select
            id="engagementId"
            name="engagementId"
            defaultValue={defaultValues?.engagementId ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">None</option>
            {engagements.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="type">Type *</Label>
          <select
            id="type"
            name="type"
            required
            defaultValue={defaultValues?.type ?? "client"}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="hours">Hours *</Label>
          <Input
            id="hours"
            name="hours"
            type="number"
            min="0.25"
            max="24"
            step="0.25"
            placeholder="2.0"
            required
            defaultValue={defaultValues?.hours ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" placeholder="What did you work on?" defaultValue={defaultValues?.notes ?? ""} />
      </div>

      <div className="flex gap-2">
        <Button type="submit">{isEdit ? "Save" : "Log Entry"}</Button>
        {isEdit && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
