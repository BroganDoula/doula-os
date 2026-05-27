"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EngagementForm } from "../engagement-form";

const PHASE_LABELS: Record<string, string> = {
  definition:       "1 — Definition",
  works_like:       "2 — Works-Like",
  looks_works_like: "3 — Looks-Works-Like",
  design_package:   "4 — Design Package",
  rfq:              "5 — RFQ",
  manufacture:      "6 — Manufacture",
};

type Engagement = {
  id: string;
  name: string;
  companyId: string;
  companyName: string | null;
  phase: string;
  status: string;
  rateCents: number | null;
  weeklyHourCommitment: number | null;
  startedAt: string | null;
  notes: string | null;
};

type Company = { id: string; name: string };

export function ProjectHeader({
  engagement,
  companies,
}: {
  engagement: Engagement;
  companies: Company[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <EngagementForm
        companies={companies}
        defaultValues={engagement}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold">{engagement.name}</h1>
        <p className="text-sm text-muted-foreground mt-1 space-x-2">
          {engagement.companyName && <span>{engagement.companyName}</span>}
          {engagement.companyName && <span>·</span>}
          <span>{PHASE_LABELS[engagement.phase] ?? engagement.phase}</span>
          <span>·</span>
          <span className="capitalize">{engagement.status}</span>
          {engagement.rateCents != null && (
            <>
              <span>·</span>
              <span>${(engagement.rateCents / 100).toLocaleString()}/hr</span>
            </>
          )}
          {engagement.weeklyHourCommitment != null && (
            <>
              <span>·</span>
              <span>{engagement.weeklyHourCommitment} hrs/wk</span>
            </>
          )}
          {engagement.startedAt && (
            <>
              <span>·</span>
              <span>Started {engagement.startedAt}</span>
            </>
          )}
        </p>
        {engagement.notes && (
          <p className="text-sm text-muted-foreground mt-2">{engagement.notes}</p>
        )}
      </div>
      <Button variant="outline" size="sm" className="shrink-0" onClick={() => setEditing(true)}>
        Edit
      </Button>
    </div>
  );
}
