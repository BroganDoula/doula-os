"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HoursForm } from "./hours-form";
import { deleteHoursEntry } from "./actions";

type HoursRow = {
  id: string;
  date: string;
  hours: number;
  type: string;
  notes: string | null;
  engagementId: string | null;
  engagementName: string | null;
};

type Engagement = { id: string; name: string };

const TYPE_LABELS: Record<string, string> = {
  client: "Client",
  bd: "BD",
  admin: "Admin",
  driving: "Driving",
};

export function HoursList({
  rows,
  engagements,
  today,
}: {
  rows: HoursRow[];
  engagements: Engagement[];
  today: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalHours = rows.reduce((sum, r) => sum + Number(r.hours), 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Log</h2>
        <span className="text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? "entry" : "entries"} · {totalHours.toFixed(1)} hrs
        </span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium">Engagement</th>
            <th className="pb-2 font-medium">Type</th>
            <th className="pb-2 font-medium">Hours</th>
            <th className="pb-2 font-medium">Notes</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-center text-muted-foreground">
                No entries for this period.
              </td>
            </tr>
          )}
          {rows.map((r) =>
            editingId === r.id ? (
              <tr key={r.id}>
                <td colSpan={6} className="py-2">
                  <HoursForm
                    engagements={engagements}
                    today={today}
                    defaultValues={r}
                    onCancel={() => setEditingId(null)}
                  />
                </td>
              </tr>
            ) : (
              <tr key={r.id} className="border-b">
                <td className="py-2 text-muted-foreground tabular-nums">{r.date}</td>
                <td className="py-2">{r.engagementName ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{TYPE_LABELS[r.type] ?? r.type}</td>
                <td className="py-2 font-medium tabular-nums">{r.hours.toFixed(1)}</td>
                <td className="py-2 text-muted-foreground max-w-xs truncate">{r.notes ?? "—"}</td>
                <td className="py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(r.id)}>Edit</Button>
                    <form action={deleteHoursEntry}>
                      <input type="hidden" name="id" value={r.id} />
                      <Button variant="ghost" size="sm" type="submit">Delete</Button>
                    </form>
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
