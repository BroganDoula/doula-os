"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  companies,
  contacts,
  deals,
  engagements,
  deliverables,
  hoursEntries,
  contracts,
  ndas,
  financialEntries,
} from "@/db/schema";

export async function restoreCompany(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  await db.update(companies).set({ deletedAt: null }).where(eq(companies.id, id));
  revalidatePath("/companies");
  revalidatePath("/archived");
  revalidatePath(`/companies/${id}`);
}

export async function restoreContact(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const [row] = await db
    .select({ companyId: contacts.companyId })
    .from(contacts).where(eq(contacts.id, id)).limit(1);

  await db.update(contacts).set({ deletedAt: null }).where(eq(contacts.id, id));
  revalidatePath("/contacts");
  revalidatePath("/archived");
  if (row?.companyId) revalidatePath(`/companies/${row.companyId}`);
}

export async function restoreDeal(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const [row] = await db
    .select({ companyId: deals.companyId })
    .from(deals).where(eq(deals.id, id)).limit(1);

  await db.update(deals).set({ deletedAt: null }).where(eq(deals.id, id));
  revalidatePath("/pipeline");
  revalidatePath("/archived");
  if (row?.companyId) revalidatePath(`/companies/${row.companyId}`);
}

export async function restoreEngagement(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  await db.update(engagements).set({ deletedAt: null }).where(eq(engagements.id, id));
  revalidatePath("/projects");
  revalidatePath("/archived");
}

export async function restoreDeliverable(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const [row] = await db
    .select({ engagementId: deliverables.engagementId })
    .from(deliverables).where(eq(deliverables.id, id)).limit(1);

  await db.update(deliverables).set({ deletedAt: null }).where(eq(deliverables.id, id));
  revalidatePath("/archived");
  if (row?.engagementId) revalidatePath(`/projects/${row.engagementId}`);
}

export async function restoreHoursEntry(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const [row] = await db
    .select({ engagementId: hoursEntries.engagementId })
    .from(hoursEntries).where(eq(hoursEntries.id, id)).limit(1);

  await db.update(hoursEntries).set({ deletedAt: null }).where(eq(hoursEntries.id, id));
  revalidatePath("/hours");
  revalidatePath("/archived");
  if (row?.engagementId) revalidatePath(`/projects/${row.engagementId}`);
}

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
