import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { engagements, proposals, deliverables, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { ProposalUploadForm } from "./proposal-upload-form";
import { DeliverableAddForm } from "./deliverable-add-form";
import { deleteProposal, deleteDeliverable, toggleDeliverable } from "../actions";

const PHASE_LABELS = [
  "",
  "Definition",
  "Works-Like",
  "Looks-Works-Like",
  "Design Package",
  "RFQ",
  "Manufacture",
];

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
      .select({
        id: proposals.id,
        fileName: proposals.fileName,
        uploadedAt: proposals.uploadedAt,
      })
      .from(proposals)
      .where(eq(proposals.engagementId, id))
      .orderBy(proposals.uploadedAt),
    db
      .select()
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
        <Link href="/engagements" className="text-sm text-muted-foreground hover:text-foreground">
          ← Engagements
        </Link>
        <h1 className="text-xl font-semibold mt-2">{engagement.name}</h1>
        <p className="text-sm text-muted-foreground mt-1 space-x-2">
          <span>{engagement.companyName}</span>
          <span>·</span>
          <span>Phase {engagement.phase} — {PHASE_LABELS[engagement.phase]}</span>
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

      {/* Proposals + Deliverables */}
      <section className="space-y-4">
        <h2 className="font-medium">Proposals</h2>

        <ProposalUploadForm engagementId={engagement.id} clientId={clientId} />

        {proposalRows.length === 0 && (
          <p className="text-sm text-muted-foreground">No proposals uploaded yet.</p>
        )}

        {proposalRows.map((proposal) => {
          const items = deliverableRows.filter((d) => d.proposalId === proposal.id);
          const done = items.filter((d) => d.status === "complete").length;

          return (
            <div key={proposal.id} className="border rounded-lg p-4 space-y-3">
              {/* Proposal row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <a
                    href={`/api/proposals/${proposal.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-sm hover:underline"
                  >
                    {proposal.fileName}
                  </a>
                  <span className="text-xs text-muted-foreground">
                    {new Date(proposal.uploadedAt).toLocaleDateString()}
                  </span>
                  {items.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {done}/{items.length} done
                    </span>
                  )}
                </div>
                <form action={deleteProposal}>
                  <input type="hidden" name="id" value={proposal.id} />
                  <input type="hidden" name="engagementId" value={engagement.id} />
                  <Button variant="ghost" size="sm" type="submit">Delete</Button>
                </form>
              </div>

              {/* Deliverables checklist */}
              <div className="space-y-1.5 pl-1">
                {items.map((d) => (
                  <div key={d.id} className="flex items-center gap-2.5 group">
                    <form action={toggleDeliverable}>
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="engagementId" value={engagement.id} />
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
                    {d.dueDate && (
                      <span className="text-xs text-muted-foreground shrink-0">{d.dueDate}</span>
                    )}
                    <form action={deleteDeliverable} className="opacity-0 group-hover:opacity-100">
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="engagementId" value={engagement.id} />
                      <Button variant="ghost" size="sm" type="submit" className="h-6 w-6 p-0 text-muted-foreground">
                        ×
                      </Button>
                    </form>
                  </div>
                ))}

                <DeliverableAddForm
                  engagementId={engagement.id}
                  proposalId={proposal.id}
                  clientId={clientId}
                />
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
