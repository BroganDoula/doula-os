"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDeliverable } from "../actions";

export function DeliverableAddForm({
  engagementId,
  proposalId,
  clientId,
}: {
  engagementId: string;
  proposalId: string;
  clientId: string;
}) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await createDeliverable(formData);
        ref.current?.reset();
      }}
      className="flex items-center gap-2 mt-1"
    >
      <input type="hidden" name="engagementId" value={engagementId} />
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="clientId" value={clientId} />
      <Input name="title" placeholder="Add deliverable…" className="h-7 text-sm" required />
      <Input name="dueDate" type="date" className="h-7 text-sm w-36" />
      <Button type="submit" size="sm" variant="outline" className="h-7 text-xs shrink-0">
        Add
      </Button>
    </form>
  );
}
