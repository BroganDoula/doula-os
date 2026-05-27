import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { engagements, proposals, deliverables, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { ProposalUploadForm } from "./proposal-upload-form";
import { DeliverableList } from "./deliverable-list";
import { deleteProposal } from "../actions";

const PHASE_LABELS: Record<string, string> = {
  definition:       "1 — Definition",
  works_like:       "2 — Works-Like",
  looks_works_like: "3 — Looks-Works-Like",
  design_package:   "4 — Design Package",
  rfq:              "5 — RFQ",
  manufacture:      "6 — Manufacture",
};

export default async function EngagementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [engagementRows, proposalRows, deliverableRows] = await Promise.all([
    db
      .select({
        id: engagements.id,
        name: engagements.name,
        phase: engagements.phase,
        status: engagements.status,
        rateCents: engagements.rateCents,
        weeklyHourCommitment: engagements.weeklyHourCommitment,
        startedAt: engagements.startedAt,
        notes: engagements.notes,
        companyId: engagements.companyId,
        clientId: engagements.clientId,
        companyName: companies.name,
      })
      .from(engagements)
      .leftJoin(companies, eq(engagements.companyId, companies.id))
      .where(eq(engagements.id, id))
      .limit(1),
    db
      .select({ id: proposals.id, fileName: proposals.fileName, uploadedAt: proposals.uploadedAt })
      .from(proposals)
      .where(eq(proposals.engagementId, id))
      .orderBy(proposals.uploadedAt),
    db
      .select({
        id: deliverables.id,
        title: deliverables.title,
        status: deliverables.status,
        proposalId: deliverables.proposalId,
        dueDate: deliverables.dueDate,
      })
      .from(deliverables)
      .where(eq(deliverables.engagementId, id))
      .orderBy(deliverables.createdAt),
  ]);

  const engagement = engagementRows[0];
  if (!engagement) notFound();

  const clientId = engagement.clientId ?? engagement.companyId;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div>
        <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
          ← Projects
        </Link>
        <h1 className="text-xl font-semibold mt-2">{engagement.name}</h1>
        <p className="text-sm text-muted-foreground mt-1 space-x-2">
          <span>{engagement.companyName}</span>
          <span>·</span>
          <span>{PHASE_LABELS[engagement.phase] ?? engagement.phase}</span>
          <span>·</span>
          <span className="capitalize">{engagement.status}</span>
          {engagement.rateCents && (
            <>
              <span>·</span>
              <span>${(engagement.rateCents / 100).toLocaleString()}/hr</span>
            </>
          )}
          {engagement.weeklyHourCommitment && (
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

      {/* Proposals */}
      <section className="space-y-3">
        <h2 className="font-medium">Proposals</h2>
        <ProposalUploadForm engagementId={engagement.id} clientId={clientId} />
        {proposalRows.length === 0 && (
          <p className="text-sm text-muted-foreground">No proposals uploaded yet.</p>
        )}
        {proposalRows.map((p) => (
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
            <form action={deleteProposal}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="engagementId" value={engagement.id} />
              <Button variant="ghost" size="sm" type="submit">Delete</Button>
            </form>
          </div>
        ))}
      </section>

      {/* Deliverables */}
      <section className="space-y-3">
        <h2 className="font-medium">Deliverables</h2>
        <DeliverableList
          deliverables={deliverableRows}
          proposals={proposalRows}
          engagementId={engagement.id}
          clientId={clientId}
        />
      </section>
    </div>
  );
}
