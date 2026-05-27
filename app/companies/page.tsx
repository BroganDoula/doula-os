import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { CompanyForm } from "./company-form";
import { deleteCompany } from "./actions";

export default async function CompaniesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const rows = await db.select().from(companies).orderBy(companies.name);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-xl font-semibold">Companies</h1>

      <CompanyForm />

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Name</th>
            <th className="pb-2 font-medium">Website</th>
            <th className="pb-2 font-medium">Notes</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-muted-foreground">
                No companies yet.
              </td>
            </tr>
          )}
          {rows.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="py-2 font-medium">{c.name}</td>
              <td className="py-2 text-muted-foreground">{c.website ?? "—"}</td>
              <td className="py-2 text-muted-foreground max-w-xs truncate">
                {c.notes ?? "—"}
              </td>
              <td className="py-2 text-right">
                <form action={deleteCompany}>
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
