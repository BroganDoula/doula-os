import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { CompanyForm } from "./company-form";
import { CompanyList } from "./company-list";

export default async function CompaniesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const rows = await db.select().from(companies).orderBy(companies.name);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-xl font-semibold">Companies</h1>
      <CompanyForm />
      <CompanyList rows={rows} />
    </div>
  );
}
