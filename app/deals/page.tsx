import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { deals, companies, contacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { DealForm } from "./deal-form";
import { deleteDeal } from "./actions";

const STAGE_LABELS: Record<string, string> = {
  prospect: "Prospect",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Won",
  closed_lost: "Lost",
};

const STAGE_COLORS: Record<string, string> = {
  prospect: "text-muted-foreground",
  qualified: "text-blue-600",
  proposal: "text-yellow-600",
  negotiation: "text-orange-600",
  closed_won: "text-green-600",
  closed_lost: "text-red-500",
};

function formatDollars(cents: number | null) {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function DealsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [rows, companyList, contactList] = await Promise.all([
    db
      .select({
        id: deals.id,
        stage: deals.stage,
        closeWindowMonths: deals.closeWindowMonths,
        dealSizeCents: deals.dealSizeCents,
        nextSteps: deals.nextSteps,
        referralSource: deals.referralSource,
        companyName: companies.name,
        contactName: contacts.name,
      })
      .from(deals)
      .leftJoin(companies, eq(deals.companyId, companies.id))
      .leftJoin(contacts, eq(deals.contactId, contacts.id))
      .orderBy(deals.createdAt),
    db.select({ id: companies.id, name: companies.name }).from(companies).orderBy(companies.name),
    db
      .select({ id: contacts.id, name: contacts.name, companyId: contacts.companyId })
      .from(contacts)
      .orderBy(contacts.name),
  ]);

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <h1 className="text-xl font-semibold">Pipeline</h1>

      <DealForm companies={companyList} contacts={contactList} />

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Company</th>
            <th className="pb-2 font-medium">Contact</th>
            <th className="pb-2 font-medium">Stage</th>
            <th className="pb-2 font-medium">Close</th>
            <th className="pb-2 font-medium">Size</th>
            <th className="pb-2 font-medium">Next Steps</th>
            <th className="pb-2 font-medium">Source</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="py-6 text-center text-muted-foreground">
                No deals yet.
              </td>
            </tr>
          )}
          {rows.map((d) => (
            <tr key={d.id} className="border-b">
              <td className="py-2 font-medium">{d.companyName ?? "—"}</td>
              <td className="py-2 text-muted-foreground">{d.contactName ?? "—"}</td>
              <td className={`py-2 font-medium ${STAGE_COLORS[d.stage] ?? ""}`}>
                {STAGE_LABELS[d.stage] ?? d.stage}
              </td>
              <td className="py-2 text-muted-foreground">
                {d.closeWindowMonths ? `${d.closeWindowMonths}mo` : "—"}
              </td>
              <td className="py-2 text-muted-foreground">{formatDollars(d.dealSizeCents)}</td>
              <td className="py-2 text-muted-foreground max-w-xs truncate">
                {d.nextSteps ?? "—"}
              </td>
              <td className="py-2 text-muted-foreground">{d.referralSource ?? "—"}</td>
              <td className="py-2 text-right">
                <form action={deleteDeal}>
                  <input type="hidden" name="id" value={d.id} />
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
