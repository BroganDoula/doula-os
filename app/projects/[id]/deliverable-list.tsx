"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteConfirm } from "@/components/ui/delete-confirm";
import { DeliverableAddForm } from "./deliverable-add-form";
import { deleteDeliverable, toggleDeliverable } from "../actions";

type Deliverable = {
  id: string;
  title: string;
  status: string;
  proposalId: string | null;
  dueDate: string | null;
};

type Proposal = { id: string; fileName: string };

export function DeliverableList({
  deliverables,
  proposals,
  engagementId,
  clientId,
}: {
  deliverables: Deliverable[];
  proposals: Proposal[];
  engagementId: string;
  clientId: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const proposalMap = new Map(proposals.map((p) => [p.id, p.fileName]));

  return (
    <div className="space-y-3">
      <DeliverableAddForm
        engagementId={engagementId}
        clientId={clientId}
        proposals={proposals}
      />

      {deliverables.length === 0 && (
        <p className="text-sm text-muted-foreground">No deliverables yet.</p>
      )}

      <div className="space-y-1">
        {deliverables.map((d) =>
          editingId === d.id ? (
            <div key={d.id} className="border rounded-md p-2">
              <DeliverableAddForm
                engagementId={engagementId}
                clientId={clientId}
                proposals={proposals}
                defaultValues={d}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div key={d.id} className="flex items-center gap-2.5 group py-0.5">
              <form action={toggleDeliverable}>
                <input type="hidden" name="id" value={d.id} />
                <input type="hidden" name="engagementId" value={engagementId} />
                <input type="hidden" name="currentStatus" value={d.status} />
                <button
                  type="submit"
                  className={`w-4 h-4 rounded border shrink-0 transition-colors ${
                    d.status === "complete"
                      ? "bg-green-500 border-green-500"
                      : "border-border hover:border-green-400"
                  }`}
                />
              </form>

              <span
                className={`text-sm flex-1 ${
                  d.status === "complete" ? "line-through text-muted-foreground" : ""
                }`}
              >
                {d.title}
              </span>

              {d.proposalId && proposalMap.has(d.proposalId) && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                  {proposalMap.get(d.proposalId)}
                </span>
              )}

              {d.dueDate && (
                <span className="text-xs text-muted-foreground shrink-0">{d.dueDate}</span>
              )}

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => setEditingId(d.id)}
                >
                  Edit
                </Button>
                <DeleteConfirm
                  title="Delete deliverable?"
                  description={`This will permanently delete "${d.title}".`}
                  onConfirm={async () => {
                    const fd = new FormData();
                    fd.append("id", d.id);
                    fd.append("engagementId", engagementId);
                    await deleteDeliverable(fd);
                  }}
                />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
