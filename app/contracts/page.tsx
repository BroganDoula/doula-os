import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { contracts, companies } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { ContractForm } from "./contract-form";
import { ContractList } from "./contract-list";

export default async function ContractsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [rows, companyList] = await Promise.all([
    db
      .select({
        id: contracts.id,
        companyId: contracts.companyId,
        fileName: contracts.fileName,
        signedDate: contracts.signedDate,
        termMonths: contracts.termMonths,
        valueCents: contracts.valueCents,
        notes: contracts.notes,
        companyName: companies.name,
      })
      .from(contracts)
      .leftJoin(companies, eq(contracts.companyId, companies.id))
      .where(isNull(contracts.deletedAt))
      .orderBy(contracts.createdAt),
    db.select({ id: companies.id, name: companies.name }).from(companies).orderBy(companies.name),
  ]);

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <h1 className="text-xl font-semibold">Contracts</h1>
      <ContractForm companies={companyList} />
      <ContractList rows={rows} companies={companyList} />
    </div>
  );
}
