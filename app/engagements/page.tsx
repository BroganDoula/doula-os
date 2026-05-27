import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { engagements, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { EngagementForm } from "./engagement-form";
import { deleteEngagement } from "./actions";

const PHASE_LABELS = [
  "",
  "Definition",
  "Works-Like",
  "Looks-Works-Like",
  "Design Package",
  "RFQ",
  "Manufacture",
];

const STATUS_COLORS: Record<string, string> = {
  active: "text-green-600",
  paused: "text-yellow-600",
  complete: "text-muted-foreground",
};

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
        companyName: companies.name,
      })
      .from(engagements)
      .leftJoin(companies, eq(engagements.companyId, companies.id))
      .orderBy(engagements.createdAt),
    db.select({ id: companies.id, name: companies.name }).from(companies).orderBy(companies.name),
  ]);

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <h1 className="text-xl font-semibold">Engagements</h1>

      <EngagementForm companies={companyList} />

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Name</th>
            <th className="pb-2 font-medium">Company</th>
            <th className="pb-2 font-medium">Phase</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Rate/hr</th>
            <th className="pb-2 font-medium">Hrs/wk</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="py-6 text-center text-muted-foreground">
                No engagements yet.
              </td>
            </tr>
          )}
          {rows.map((e) => (
            <tr key={e.id} className="border-b">
              <td className="py-2 font-medium">
                <Link href={`/engagements/${e.id}`} className="hover:underline">
                  {e.name}
                </Link>
              </td>
              <td className="py-2 text-muted-foreground">{e.companyName ?? "—"}</td>
              <td className="py-2 text-muted-foreground">
                {e.phase} — {PHASE_LABELS[e.phase] ?? ""}
              </td>
              <td className={`py-2 font-medium capitalize ${STATUS_COLORS[e.status] ?? ""}`}>
                {e.status}
              </td>
              <td className="py-2 text-muted-foreground">
                {e.rateCents ? `$${(e.rateCents / 100).toLocaleString()}` : "—"}
              </td>
              <td className="py-2 text-muted-foreground">{e.weeklyHourCommitment ?? "—"}</td>
              <td className="py-2 text-right">
                <form action={deleteEngagement}>
                  <input type="hidden" name="id" value={e.id} />
                  <Button variant="ghost" size="sm" type="submit">Delete</Button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
