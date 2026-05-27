"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { companies, engagements, contracts, ndas } from "@/db/schema";

export async function createCompany(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const name = (formData.get("name") as string).trim();
  if (!name) throw new Error("Name is required");

  const website = (formData.get("website") as string).trim() || null;
  const notes = (formData.get("notes") as string).trim() || null;

  await db.insert(companies).values({ name, website, notes, createdBy: userId, updatedBy: userId, reviewedAt: new Date() });
  revalidatePath("/companies");
}

export async function updateCompany(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  if (!name) throw new Error("Name is required");

  await db.update(companies).set({
    name,
    website: (formData.get("website") as string).trim() || null,
    notes: (formData.get("notes") as string).trim() || null,
    updatedBy: userId,
  }).where(eq(companies.id, id));
  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
}

export async function deleteCompany(formData: FormData): Promise<{ error: string } | undefined> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;

  const [linkedProject, linkedContract, linkedNda] = await Promise.all([
    db.select({ id: engagements.id }).from(engagements)
      .where(and(eq(engagements.companyId, id), isNull(engagements.deletedAt))).limit(1),
    db.select({ id: contracts.id }).from(contracts)
      .where(and(eq(contracts.companyId, id), isNull(contracts.deletedAt))).limit(1),
    db.select({ id: ndas.id }).from(ndas)
      .where(and(eq(ndas.companyId, id), isNull(ndas.deletedAt))).limit(1),
  ]);

  if (linkedProject.length > 0 || linkedContract.length > 0 || linkedNda.length > 0) {
    return { error: "Can't hide: this company has active projects, contracts, or NDAs. Archive those first." };
  }

  await db.update(companies).set({ deletedAt: new Date() }).where(eq(companies.id, id));
  revalidatePath("/companies");
  return undefined;
}

export async function restoreCompany(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  await db.update(companies).set({ deletedAt: null }).where(eq(companies.id, id));
  revalidatePath("/companies");
  revalidatePath("/archived");
  revalidatePath(`/companies/${id}`);
}
