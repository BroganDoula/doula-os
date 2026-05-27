import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  companies,
  contacts,
  engagements,
  deals,
  contracts,
  ndas,
} from "@/db/schema";
import { CompanyHeader } from "./company-header";
import { CompanyContactsSection } from "./company-contacts-section";
import { CompanyContractsSection } from "./company-contracts-section";
import { ProjectNdasSection } from "@/app/projects/[id]/project-ndas-section";
import { ProjectActivitySection } from "@/app/projects/[id]/project-activity-section";
import type { ActivityItem } from "@/app/projects/[id]/project-activity-section";

const PHASE_LABELS: Record<string, string> = {
  definition:       "1 — Definition",
  works_like:       "2 — Works-Like",
  looks_works_like: "3 — Looks-Works-Like",
  design_package:   "4 — Design Package",
  rfq:              "5 — RFQ",
  manufacture:      "6 — Manufacture",
};

const STAGE_LABELS: Record<string, string> = {
  prospect: "Prospect",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed — Won",
  closed_lost: "Closed — Lost",
};

function formatDollars(cents: number | null) {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [
    companyRows,
    contactRows,
    projectRows,
    dealRows,
    contractRows,
    ndaRows,
    recentContactRows,
    recentDealRows,
    recentContractRows,
    recentProjectRows,
  ] = await Promise.all([
    db
      .select({ id: companies.id, name: companies.name, website: companies.website, notes: companies.notes })
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1),

    db
      .select({
        id: contacts.id,
        name: contacts.name,
        email: contacts.email,
        phone: contacts.phone,
        role: contacts.role,
        notes: contacts.notes,
        companyId: contacts.companyId,
      })
      .from(contacts)
      .where(and(eq(contacts.companyId, id), isNull(contacts.deletedAt)))
      .orderBy(contacts.name),

    db
      .select({
        id: engagements.id,
        name: engagements.name,
        phase: engagements.phase,
        status: engagements.status,
        startedAt: engagements.startedAt,
      })
      .from(engagements)
      .where(and(eq(engagements.companyId, id), isNull(engagements.deletedAt)))
      .orderBy(engagements.startedAt),

    db
      .select({
        id: deals.id,
        stage: deals.stage,
        dealSizeCents: deals.dealSizeCents,
        closeWindowMonths: deals.closeWindowMonths,
        nextSteps: deals.nextSteps,
        contactName: contacts.name,
      })
      .from(deals)
      .leftJoin(contacts, eq(deals.contactId, contacts.id))
      .where(and(eq(deals.companyId, id), isNull(deals.deletedAt)))
      .orderBy(deals.createdAt),

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
      .where(and(eq(contracts.companyId, id), isNull(contracts.deletedAt)))
      .orderBy(contracts.createdAt),

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
      .where(and(eq(ndas.companyId, id), isNull(ndas.deletedAt)))
      .orderBy(ndas.expirationDate),

    // Recent activity streams
    db
      .select({ name: contacts.name, createdAt: contacts.createdAt })
      .from(contacts)
      .where(and(eq(contacts.companyId, id), isNull(contacts.deletedAt)))
      .orderBy(desc(contacts.createdAt))
      .limit(3),

    db
      .select({ stage: deals.stage, updatedAt: deals.updatedAt })
      .from(deals)
      .where(and(eq(deals.companyId, id), isNull(deals.deletedAt)))
      .orderBy(desc(deals.updatedAt))
      .limit(3),

    db
      .select({ fileName: contracts.fileName, createdAt: contracts.createdAt })
      .from(contracts)
      .where(and(eq(contracts.companyId, id), isNull(contracts.deletedAt)))
      .orderBy(desc(contracts.createdAt))
      .limit(3),

    db
      .select({ name: engagements.name, createdAt: engagements.createdAt })
      .from(engagements)
      .where(and(eq(engagements.companyId, id), isNull(engagements.deletedAt)))
      .orderBy(desc(engagements.createdAt))
      .limit(3),
  ]);

  const company = companyRows[0];
  if (!company) notFound();

  // Recent activity — merge 4 streams, sort desc, take top 5
  const activity: ActivityItem[] = [
    ...recentContactRows.map((c) => ({
      label: "Contact added",
      detail: c.name,
      at: new Date(c.createdAt).toISOString(),
    })),
    ...recentDealRows.map((d) => ({
      label: "Lead updated",
      detail: STAGE_LABELS[d.stage] ?? d.stage,
      at: new Date(d.updatedAt).toISOString(),
    })),
    ...recentContractRows.map((c) => ({
      label: "Contract added",
      detail: c.fileName,
      at: new Date(c.createdAt).toISOString(),
    })),
    ...recentProjectRows.map((e) => ({
      label: "Project added",
      detail: e.name,
      at: new Date(e.createdAt).toISOString(),
    })),
  ];
  activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const recentActivity = activity.slice(0, 5);

  const projects = projectRows.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-10">
      {/* Back link + header */}
      <div>
        <Link href="/companies" className="text-sm text-muted-foreground hover:text-foreground">
          ← Companies
        </Link>
        <div className="mt-2">
          <CompanyHeader company={company} />
        </div>
      </div>

      {/* Contacts */}
      <section className="space-y-3">
        <h2 className="font-medium">Contacts</h2>
        <CompanyContactsSection
          contacts={contactRows}
          companyId={company.id}
          companyName={company.name}
        />
      </section>

      {/* Projects */}
      <section className="space-y-3">
        <h2 className="font-medium">Projects</h2>
        {projectRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects for this company.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Phase</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Started</th>
              </tr>
            </thead>
            <tbody>
              {projectRows.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2 font-medium">
                    <Link href={`/projects/${p.id}`} className="hover:underline">{p.name}</Link>
                  </td>
                  <td className="py-2 text-muted-foreground">{PHASE_LABELS[p.phase] ?? p.phase}</td>
                  <td className="py-2 text-muted-foreground capitalize">{p.status}</td>
                  <td className="py-2 text-muted-foreground">{p.startedAt ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Deals */}
      <section className="space-y-3">
        <h2 className="font-medium">Leads</h2>
        {dealRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leads for this company.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Stage</th>
                <th className="pb-2 font-medium">Size</th>
                <th className="pb-2 font-medium">Close</th>
                <th className="pb-2 font-medium">Contact</th>
                <th className="pb-2 font-medium">Next Steps</th>
              </tr>
            </thead>
            <tbody>
              {dealRows.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="py-2 font-medium">{STAGE_LABELS[d.stage] ?? d.stage}</td>
                  <td className="py-2 text-muted-foreground">{formatDollars(d.dealSizeCents)}</td>
                  <td className="py-2 text-muted-foreground">
                    {d.closeWindowMonths ? `${d.closeWindowMonths}mo` : "—"}
                  </td>
                  <td className="py-2 text-muted-foreground">{d.contactName ?? "—"}</td>
                  <td className="py-2 text-muted-foreground max-w-xs truncate">
                    {d.nextSteps ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Contracts */}
      <section className="space-y-3">
        <h2 className="font-medium">Contracts</h2>
        <CompanyContractsSection
          rows={contractRows}
          companyId={company.id}
          companyName={company.name}
          projects={projects}
        />
      </section>

      {/* NDAs */}
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
