import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { engagements, companies } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { EngagementForm } from "./engagement-form";
import { EngagementList } from "./engagement-list";

export default async function EngagementsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [rows, companyList] = await Promise.all([
    db
      .select({
        id: engagements.id,
        name: engagements.name,
        phase: engagements.phase,
        status: engagements.status,
        rateCents: engagements.rateCents,
        weeklyHourCommitment: engagements.weeklyHourCommitment,
        companyId: engagements.companyId,
        companyName: companies.name,
        startedAt: engagements.startedAt,
        notes: engagements.notes,
      })
      .from(engagements)
      .leftJoin(companies, eq(engagements.companyId, companies.id))
      .where(isNull(engagements.deletedAt))
      .orderBy(engagements.createdAt),
    db.select({ id: companies.id, name: companies.name }).from(companies).orderBy(companies.name),
  ]);

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <h1 className="text-xl font-semibold">Projects</h1>
      <EngagementForm companies={companyList} />
      <EngagementList rows={rows} companies={companyList} />
    </div>
  );
}
