import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  engagements,
  proposals,
  deliverables,
  companies,
  contracts,
  hoursEntries,
  ndas,
} from "@/db/schema";
import { Button } from "@/components/ui/button";
import { ProposalUploadForm } from "./proposal-upload-form";
import { DeliverableList } from "./deliverable-list";
import { ProjectHeader } from "./project-header";
import { ProjectContractsSection } from "./project-contracts-section";
import { ProjectHoursSection } from "./project-hours-section";
import { ProjectNdasSection } from "./project-ndas-section";
import { ProjectActivitySection } from "./project-activity-section";
import type { ActivityItem } from "./project-activity-section";
import { deleteProposal } from "../actions";

function getWeekStart(today: Date): string {
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Fetch engagement first — companyId is needed for the NDA query
  const engagementRows = await db
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
    .limit(1);

  const engagement = engagementRows[0];
  if (!engagement) notFound();

  const clientId = engagement.clientId ?? engagement.companyId;

  const today = new Date();
  const weekStart = getWeekStart(today);
  const fourWeeksAgo = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [
    proposalRows,
    deliverableRows,
    allCompanies,
    contractRows,
    hoursRows,
    ndaRows,
    recentProposalRows,
    recentCompletedDeliverableRows,
    recentHoursRows,
    recentContractRows,
  ] = await Promise.all([
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

    db
      .select({ id: companies.id, name: companies.name })
      .from(companies)
      .orderBy(companies.name),

    db
      .select({
        id: contracts.id,
        companyId: contracts.companyId,
        engagementId: contracts.engagementId,
        fileName: contracts.fileName,
        signedDate: contracts.signedDate,
        termMonths: contracts.termMonths,
        valueCents: contracts.valueCents,
        notes: contracts.notes,
        companyName: companies.name,
        engagementName: engagements.name,
      })
      .from(contracts)
      .leftJoin(companies, eq(contracts.companyId, companies.id))
      .leftJoin(engagements, eq(contracts.engagementId, engagements.id))
      .where(and(eq(contracts.engagementId, id), isNull(contracts.deletedAt)))
      .orderBy(contracts.createdAt),

    db
      .select({ hours: hoursEntries.hours, date: hoursEntries.date })
      .from(hoursEntries)
      .where(eq(hoursEntries.engagementId, id)),

    db
      .select({
        id: ndas.id,
        counterparty: ndas.counterparty,
        signedDate: ndas.signedDate,
        expirationDate: ndas.expirationDate,
        bidirectional: ndas.bidirectional,
        fileName: ndas.fileName,
      })
      .from(ndas)
      .where(and(eq(ndas.engagementId, id), isNull(ndas.deletedAt)))
      .orderBy(ndas.expirationDate),

    // Recent activity — 4 streams; merged + sorted in JS below
    db
      .select({ fileName: proposals.fileName, uploadedAt: proposals.uploadedAt })
      .from(proposals)
      .where(eq(proposals.engagementId, id))
      .orderBy(desc(proposals.uploadedAt))
      .limit(3),

    db
      .select({ title: deliverables.title, completedAt: deliverables.completedAt })
      .from(deliverables)
      .where(and(eq(deliverables.engagementId, id), eq(deliverables.status, "complete")))
      .orderBy(desc(deliverables.completedAt))
      .limit(3),

    db
      .select({
        hours: hoursEntries.hours,
        type: hoursEntries.type,
        notes: hoursEntries.notes,
        createdAt: hoursEntries.createdAt,
      })
      .from(hoursEntries)
      .where(eq(hoursEntries.engagementId, id))
      .orderBy(desc(hoursEntries.createdAt))
      .limit(3),

    db
      .select({ fileName: contracts.fileName, createdAt: contracts.createdAt })
      .from(contracts)
      .where(and(eq(contracts.engagementId, id), isNull(contracts.deletedAt)))
      .orderBy(desc(contracts.createdAt))
      .limit(3),
  ]);

  // Hours summary
  const totalHours = hoursRows.reduce((sum, r) => sum + Number(r.hours), 0);
  const thisWeekHours = hoursRows
    .filter((r) => r.date >= weekStart)
    .reduce((sum, r) => sum + Number(r.hours), 0);
  const last4WeeksHours = hoursRows
    .filter((r) => r.date >= fourWeeksAgo)
    .reduce((sum, r) => sum + Number(r.hours), 0);

  // Recent activity — merge 4 streams, sort desc, take top 5
  const activity: ActivityItem[] = [
    ...recentProposalRows.map((p) => ({
      label: "Proposal uploaded",
      detail: p.fileName,
      at: new Date(p.uploadedAt).toISOString(),
    })),
    ...recentCompletedDeliverableRows
      .filter((d) => d.completedAt !== null)
      .map((d) => ({
        label: "Deliverable completed",
        detail: d.title,
        at: new Date(d.completedAt!).toISOString(),
      })),
    ...recentHoursRows.map((h) => ({
      label: "Hours logged",
      detail: `${Number(h.hours).toFixed(1)}h · ${h.type}${h.notes ? ` — ${h.notes}` : ""}`,
      at: new Date(h.createdAt).toISOString(),
    })),
    ...recentContractRows.map((c) => ({
      label: "Contract added",
      detail: c.fileName,
      at: new Date(c.createdAt).toISOString(),
    })),
  ];
  activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const recentActivity = activity.slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-10">
      {/* Back link + header */}
      <div>
        <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
          ← Projects
        </Link>
        <div className="mt-2">
          <ProjectHeader engagement={engagement} companies={allCompanies} />
        </div>
      </div>

      {/* Contracts */}
      <section className="space-y-3">
        <h2 className="font-medium">Contracts</h2>
        <ProjectContractsSection
          rows={contractRows}
          companyId={engagement.companyId}
          companyName={engagement.companyName ?? ""}
          engagementId={engagement.id}
          engagementName={engagement.name}
        />
      </section>

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

      {/* Hours summary */}
      <section className="space-y-3">
        <h2 className="font-medium">Hours</h2>
        <ProjectHoursSection
          totalHours={totalHours}
          thisWeekHours={thisWeekHours}
          last4WeeksHours={last4WeeksHours}
          engagementId={engagement.id}
        />
      </section>

      {/* NDAs (linked via engagementId) */}
      <section className="space-y-3">
        <h2 className="font-medium">NDAs</h2>
        <ProjectNdasSection ndas={ndaRows} />
      </section>

      {/* Recent activity */}
      <section className="space-y-3">
        <h2 className="font-medium">Recent activity</h2>
        <ProjectActivitySection items={recentActivity} />
      </section>
    </div>
  );
}
