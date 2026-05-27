"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createProposal } from "../actions";

export function ProposalUploadForm({
  engagementId,
  clientId,
}: {
  engagementId: string;
  clientId: string;
}) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await createProposal(formData);
        ref.current?.reset();
      }}
      className="flex items-end gap-3 border rounded-lg p-3"
    >
      <input type="hidden" name="engagementId" value={engagementId} />
      <input type="hidden" name="clientId" value={clientId} />
      <div className="space-y-1 flex-1">
        <Label htmlFor="file" className="text-xs">Upload Proposal (PDF or Word)</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.doc,.docx"
          required
          className="w-full text-sm file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium cursor-pointer"
        />
      </div>
      <Button type="submit" size="sm">Upload</Button>
    </form>
  );
}
