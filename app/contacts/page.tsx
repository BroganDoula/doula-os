import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { contacts, companies } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { ContactForm } from "./contact-form";
import { ContactList } from "./contact-list";

export default async function ContactsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [rows, companyList] = await Promise.all([
    db
      .select({
        id: contacts.id,
        name: contacts.name,
        email: contacts.email,
        phone: contacts.phone,
        role: contacts.role,
        notes: contacts.notes,
        companyId: contacts.companyId,
        companyName: companies.name,
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(isNull(contacts.deletedAt))
      .orderBy(contacts.name),
    db.select().from(companies).where(isNull(companies.deletedAt)).orderBy(companies.name),
  ]);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-xl font-semibold">Contacts</h1>
      <ContactForm companies={companyList} />
      <ContactList rows={rows} companies={companyList} />
    </div>
  );
}
