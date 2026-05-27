import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { ndas, companies, engagements } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { NdaForm } from "./nda-form";
import { NdaList } from "./nda-list";

export default async function NdasPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [rows, companyList, engagementList] = await Promise.all([
    db
      .select({
        id: ndas.id,
        counterparty: ndas.counterparty,
        companyId: ndas.companyId,
        engagementId: ndas.engagementId,
        fileName: ndas.fileName,
        signedDate: ndas.signedDate,
        expirationDate: ndas.expirationDate,
        bidirectional: ndas.bidirectional,
        notes: ndas.notes,
        companyName: companies.name,
        engagementName: engagements.name,
      })
      .from(ndas)
      .leftJoin(companies, eq(ndas.companyId, companies.id))
      .leftJoin(engagements, eq(ndas.engagementId, engagements.id))
      .where(isNull(ndas.deletedAt))
      .orderBy(ndas.expirationDate),
    db.select({ id: companies.id, name: companies.name }).from(companies).orderBy(companies.name),
    db
      .select({ id: engagements.id, name: engagements.name, companyId: engagements.companyId })
      .from(engagements)
      .where(isNull(engagements.deletedAt))
      .orderBy(engagements.name),
  ]);

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <h1 className="text-xl font-semibold">NDAs</h1>
      <NdaForm companies={companyList} engagements={engagementList} />
      <NdaList rows={rows} companies={companyList} engagements={engagementList} />
    </div>
  );
}
