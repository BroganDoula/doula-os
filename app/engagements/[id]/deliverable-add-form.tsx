"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDeliverable, updateDeliverable } from "../actions";

type Proposal = { id: string; fileName: string };

type DefaultValues = {
  id: string;
  title: string;
  proposalId: string | null;
  dueDate: string | null;
};

export function DeliverableAddForm({
  engagementId,
  clientId,
  proposals,
  defaultValues,
  onCancel,
}: {
  engagementId: string;
  clientId: string;
  proposals: Proposal[];
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
          await updateDeliverable(formData);
        } else {
          await createDeliverable(formData);
          ref.current?.reset();
        }
        onCancel?.();
      }}
      className="flex items-center gap-2 flex-wrap"
    >
      <input type="hidden" name="engagementId" value={engagementId} />
      <input type="hidden" name="clientId" value={clientId} />
      {isEdit && <input type="hidden" name="id" value={defaultValues.id} />}

      <Input
        name="title"
        placeholder="Deliverable title…"
        className="h-8 text-sm flex-1 min-w-40"
        required
        defaultValue={defaultValues?.title}
      />

      {proposals.length > 0 && (
        <select
          name="proposalId"
          defaultValue={defaultValues?.proposalId ?? ""}
          className="border rounded-md px-2 py-1.5 text-sm bg-background h-8"
        >
          <option value="">No proposal</option>
          {proposals.map((p) => (
            <option key={p.id} value={p.id}>{p.fileName}</option>
          ))}
        </select>
      )}

      <Input
        name="dueDate"
        type="date"
        className="h-8 text-sm w-36"
        defaultValue={defaultValues?.dueDate ?? ""}
      />

      <Button type="submit" size="sm" variant="outline" className="h-8 text-xs shrink-0">
        {isEdit ? "Save" : "Add"}
      </Button>
      {isEdit && (
        <Button type="button" size="sm" variant="ghost" className="h-8 text-xs shrink-0" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </form>
  );
}
