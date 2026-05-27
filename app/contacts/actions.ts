"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";

export async function createContact(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const name = (formData.get("name") as string).trim();
  if (!name) throw new Error("Name is required");

  const email = (formData.get("email") as string).trim() || null;
  const phone = (formData.get("phone") as string).trim() || null;
  const role = (formData.get("role") as string).trim() || null;
  const notes = (formData.get("notes") as string).trim() || null;
  const companyId = (formData.get("companyId") as string) || null;
  const clientId = companyId;

  await db.insert(contacts).values({ name, email, phone, role, notes, companyId, clientId, createdBy: userId, updatedBy: userId, reviewedAt: new Date() });
  revalidatePath("/contacts");
  if (companyId) revalidatePath(`/companies/${companyId}`);
}

export async function updateContact(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  if (!name) throw new Error("Name is required");

  const companyId = (formData.get("companyId") as string) || null;
  await db.update(contacts).set({
    name,
    email: (formData.get("email") as string).trim() || null,
    phone: (formData.get("phone") as string).trim() || null,
    role: (formData.get("role") as string).trim() || null,
    notes: (formData.get("notes") as string).trim() || null,
    companyId,
    clientId: companyId,
    updatedBy: userId,
  }).where(eq(contacts.id, id));
  revalidatePath("/contacts");
  if (companyId) revalidatePath(`/companies/${companyId}`);
}

export async function deleteContact(formData: FormData): Promise<{ error: string } | undefined> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const companyId = (formData.get("companyId") as string) || null;
  await db.update(contacts).set({ deletedAt: new Date() }).where(eq(contacts.id, id));
  revalidatePath("/contacts");
  if (companyId) revalidatePath(`/companies/${companyId}`);
  return undefined;
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
