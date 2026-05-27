"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { deals } from "@/db/schema";

export async function createDeal(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const companyId = (formData.get("companyId") as string).trim();
  if (!companyId) throw new Error("Company is required");

  const contactId = (formData.get("contactId") as string) || null;
  const stage = (formData.get("stage") as string) || "prospect";
  const closeWindowRaw = formData.get("closeWindowMonths") as string;
  const closeWindowMonths = closeWindowRaw ? parseInt(closeWindowRaw, 10) : null;
  const dealSizeRaw = (formData.get("dealSize") as string).trim();
  const dealSizeCents = dealSizeRaw ? Math.round(parseFloat(dealSizeRaw) * 100) : null;
  const nextSteps = (formData.get("nextSteps") as string).trim() || null;
  const referralSource = (formData.get("referralSource") as string).trim() || null;
  const notes = (formData.get("notes") as string).trim() || null;

  await db.insert(deals).values({
    companyId,
    clientId: companyId,
    contactId,
    stage: stage as "prospect" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost",
    closeWindowMonths,
    dealSizeCents,
    nextSteps,
    referralSource,
    notes,
  });

  revalidatePath("/deals");
}

export async function deleteDeal(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  await db.delete(deals).where(eq(deals.id, id));
  revalidatePath("/deals");
}
