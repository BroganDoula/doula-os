"use client";

import { DeleteConfirm } from "@/components/ui/delete-confirm";
import { deleteProposal } from "../actions";

type ProposalRow = {
  id: string;
  fileName: string;
  uploadedAt: string;
};

export function ProjectProposalsSection({
  proposals,
  engagementId,
}: {
  proposals: ProposalRow[];
  engagementId: string;
}) {
  if (proposals.length === 0) {
    return <p className="text-sm text-muted-foreground">No proposals uploaded yet.</p>;
  }

  return (
    <div className="space-y-2">
      {proposals.map((p) => (
        <div key={p.id} className="flex items-center justify-between border rounded-md px-3 py-2">
          <div className="flex items-center gap-3">
            <a
              href={`/api/proposals/${p.id}/file`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium hover:underline"
            >
              {p.fileName}
            </a>
            <span className="text-xs text-muted-foreground">
              {new Date(p.uploadedAt).toLocaleDateString()}
            </span>
          </div>
          <DeleteConfirm
            title="Delete proposal?"
            description={`This will permanently delete ${p.fileName}.`}
            onConfirm={async () => {
              const fd = new FormData();
              fd.append("id", p.id);
              fd.append("engagementId", engagementId);
              await deleteProposal(fd);
            }}
          />
        </div>
      ))}
    </div>
  );
}
