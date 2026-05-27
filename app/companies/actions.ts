"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { companies } from "@/db/schema";

export async function createCompany(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const name = (formData.get("name") as string).trim();
  if (!name) throw new Error("Name is required");

  const website = (formData.get("website") as string).trim() || null;
  const notes = (formData.get("notes") as string).trim() || null;

  await db.insert(companies).values({ name, website, notes });
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
  }).where(eq(companies.id, id));
  revalidatePath("/companies");
}

export async function deleteCompany(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  await db.delete(companies).where(eq(companies.id, id));
  revalidatePath("/companies");
}
