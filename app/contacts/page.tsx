import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { contacts, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { ContactForm } from "./contact-form";
import { deleteContact } from "./actions";

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
        companyName: companies.name,
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .orderBy(contacts.name),
    db.select().from(companies).orderBy(companies.name),
  ]);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-xl font-semibold">Contacts</h1>

      <ContactForm companies={companyList} />

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Name</th>
            <th className="pb-2 font-medium">Company</th>
            <th className="pb-2 font-medium">Role</th>
            <th className="pb-2 font-medium">Email</th>
            <th className="pb-2 font-medium">Phone</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-center text-muted-foreground">
                No contacts yet.
              </td>
            </tr>
          )}
          {rows.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="py-2 font-medium">{c.name}</td>
              <td className="py-2 text-muted-foreground">{c.companyName ?? "—"}</td>
              <td className="py-2 text-muted-foreground">{c.role ?? "—"}</td>
              <td className="py-2 text-muted-foreground">{c.email ?? "—"}</td>
              <td className="py-2 text-muted-foreground">{c.phone ?? "—"}</td>
              <td className="py-2 text-right">
                <form action={deleteContact}>
                  <input type="hidden" name="id" value={c.id} />
                  <Button variant="ghost" size="sm" type="submit">
                    Delete
                  </Button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
