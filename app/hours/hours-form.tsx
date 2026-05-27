"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createHoursEntry } from "./actions";

const TYPE_OPTIONS = [
  { value: "client", label: "Client Work" },
  { value: "bd", label: "BD" },
  { value: "admin", label: "Admin" },
  { value: "driving", label: "Driving" },
];

type Engagement = { id: string; name: string };

export function HoursForm({
  engagements,
  today,
}: {
  engagements: Engagement[];
  today: string;
}) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await createHoursEntry(formData);
        ref.current?.reset();
      }}
      className="border rounded-lg p-4 space-y-4"
    >
      <h2 className="font-medium">Log Hours</h2>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1">
          <Label htmlFor="date">Date *</Label>
          <Input id="date" name="date" type="date" defaultValue={today} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="engagementId">Engagement</Label>
          <select
            id="engagementId"
            name="engagementId"
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
            defaultValue="client"
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
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" placeholder="What did you work on?" />
      </div>

      <Button type="submit">Log Entry</Button>
    </form>
  );
}
