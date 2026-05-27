"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { contracts, ndas, engagements, financialEntries } from "@/db/schema";

export async function restoreContract(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const [row] = await db
    .select({ companyId: contracts.companyId, engagementId: contracts.engagementId })
    .from(contracts).where(eq(contracts.id, id)).limit(1);

  await db.update(contracts).set({ deletedAt: null }).where(eq(contracts.id, id));
  revalidatePath("/contracts");
  revalidatePath("/archived");
  if (row?.companyId) revalidatePath(`/companies/${row.companyId}`);
  if (row?.engagementId) revalidatePath(`/projects/${row.engagementId}`);
}

export async function restoreNda(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const [row] = await db
    .select({ companyId: ndas.companyId, engagementId: ndas.engagementId })
    .from(ndas).where(eq(ndas.id, id)).limit(1);

  await db.update(ndas).set({ deletedAt: null }).where(eq(ndas.id, id));
  revalidatePath("/ndas");
  revalidatePath("/archived");
  if (row?.companyId) revalidatePath(`/companies/${row.companyId}`);
  if (row?.engagementId) revalidatePath(`/projects/${row.engagementId}`);
}

export async function restoreEngagement(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  await db.update(engagements).set({ deletedAt: null }).where(eq(engagements.id, id));
  revalidatePath("/projects");
  revalidatePath("/archived");
}

export async function restoreFinancialEntry(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const [row] = await db
    .select({ clientId: financialEntries.clientId })
    .from(financialEntries).where(eq(financialEntries.id, id)).limit(1);

  await db.update(financialEntries).set({ deletedAt: null }).where(eq(financialEntries.id, id));
  revalidatePath("/financials");
  revalidatePath("/archived");
  if (row?.clientId) revalidatePath(`/companies/${row.clientId}`);
}
