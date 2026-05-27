"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { deals } from "@/db/schema";

type Stage = "prospect" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";

function parseDealFields(formData: FormData) {
  const companyId = (formData.get("companyId") as string).trim();
  const contactId = (formData.get("contactId") as string) || null;
  const stage = ((formData.get("stage") as string) || "prospect") as Stage;
  const closeWindowRaw = formData.get("closeWindowMonths") as string;
  const closeWindowMonths = closeWindowRaw ? parseInt(closeWindowRaw, 10) : null;
  const dealSizeRaw = (formData.get("dealSize") as string).trim();
  const dealSizeCents = dealSizeRaw ? Math.round(parseFloat(dealSizeRaw) * 100) : null;
  const nextSteps = (formData.get("nextSteps") as string).trim() || null;
  const referralSource = (formData.get("referralSource") as string).trim() || null;
  const notes = (formData.get("notes") as string).trim() || null;
  return { companyId, contactId, stage, closeWindowMonths, dealSizeCents, nextSteps, referralSource, notes };
}

export async function createDeal(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { companyId, ...rest } = parseDealFields(formData);
  if (!companyId) throw new Error("Company is required");

  await db.insert(deals).values({ companyId, clientId: companyId, ...rest, createdBy: userId, updatedBy: userId, reviewedAt: new Date() });
  revalidatePath("/pipeline");
}

export async function updateDeal(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const { companyId, ...rest } = parseDealFields(formData);
  if (!companyId) throw new Error("Company is required");

  await db.update(deals).set({ companyId, clientId: companyId, ...rest, updatedBy: userId }).where(eq(deals.id, id));
  revalidatePath("/pipeline");
}

export async function deleteDeal(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  await db.delete(deals).where(eq(deals.id, id));
  revalidatePath("/pipeline");
}
