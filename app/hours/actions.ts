"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { hoursEntries, engagements } from "@/db/schema";

export async function createHoursEntry(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const date = (formData.get("date") as string).trim();
  if (!date) throw new Error("Date is required");

  const hoursRaw = (formData.get("hours") as string).trim();
  const hours = parseFloat(hoursRaw);
  if (!hoursRaw || isNaN(hours) || hours <= 0) throw new Error("Valid hours required");

  const type = formData.get("type") as "client" | "bd" | "admin" | "driving";
  const engagementId = (formData.get("engagementId") as string) || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  let clientId: string | null = null;
  if (engagementId) {
    const eng = await db
      .select({ clientId: engagements.clientId })
      .from(engagements)
      .where(eq(engagements.id, engagementId))
      .limit(1);
    clientId = eng[0]?.clientId ?? null;
  }

  await db.insert(hoursEntries).values({ date, hours, type, engagementId, clientId, notes, createdBy: userId, updatedBy: userId, reviewedAt: new Date() });
  revalidatePath("/hours");
}

export async function updateHoursEntry(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const date = (formData.get("date") as string).trim();
  if (!date) throw new Error("Date is required");
  const hoursRaw = (formData.get("hours") as string).trim();
  const hours = parseFloat(hoursRaw);
  if (!hoursRaw || isNaN(hours) || hours <= 0) throw new Error("Valid hours required");
  const type = formData.get("type") as "client" | "bd" | "admin" | "driving";
  const engagementId = (formData.get("engagementId") as string) || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  let clientId: string | null = null;
  if (engagementId) {
    const eng = await db
      .select({ clientId: engagements.clientId })
      .from(engagements)
      .where(eq(engagements.id, engagementId))
      .limit(1);
    clientId = eng[0]?.clientId ?? null;
  }

  await db.update(hoursEntries).set({ date, hours, type, engagementId, clientId, notes, updatedBy: userId }).where(eq(hoursEntries.id, id));
  revalidatePath("/hours");
}

export async function deleteHoursEntry(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  await db.update(hoursEntries).set({ deletedAt: new Date() }).where(eq(hoursEntries.id, id));
  revalidatePath("/hours");
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
