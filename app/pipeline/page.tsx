import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { deals, companies, contacts } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { DealForm } from "./deal-form";
import { DealList } from "./deal-list";

export default async function PipelinePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [rows, companyList, contactList] = await Promise.all([
    db
      .select({
        id: deals.id,
        companyId: deals.companyId,
        contactId: deals.contactId,
        stage: deals.stage,
        closeWindowMonths: deals.closeWindowMonths,
        dealSizeCents: deals.dealSizeCents,
        nextSteps: deals.nextSteps,
        referralSource: deals.referralSource,
        notes: deals.notes,
        companyName: companies.name,
        contactName: contacts.name,
      })
      .from(deals)
      .leftJoin(companies, eq(deals.companyId, companies.id))
      .leftJoin(contacts, eq(deals.contactId, contacts.id))
      .where(isNull(deals.deletedAt))
      .orderBy(deals.createdAt),
    db.select({ id: companies.id, name: companies.name }).from(companies)
      .where(isNull(companies.deletedAt)).orderBy(companies.name),
    db
      .select({ id: contacts.id, name: contacts.name, companyId: contacts.companyId })
      .from(contacts)
      .where(isNull(contacts.deletedAt))
      .orderBy(contacts.name),
  ]);

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <h1 className="text-xl font-semibold">Pipeline</h1>
      <DealForm companies={companyList} contacts={contactList} />
      <DealList rows={rows} companies={companyList} contacts={contactList} />
    </div>
  );
}
