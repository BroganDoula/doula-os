"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { financialEntries } from "@/db/schema";
import { isFKViolation } from "@/lib/db-errors";

function parseFields(formData: FormData) {
  const type = formData.get("type") as
    | "revenue"
    | "cash_on_hand"
    | "recurring_cost"
    | "ar_item";
  const clientId = (formData.get("clientId") as string)?.trim() || null;
  const description = (formData.get("description") as string).trim();
  const amountRaw = (formData.get("amount") as string).trim();
  const amountCents = amountRaw ? Math.round(parseFloat(amountRaw) * 100) : 0;
  const date = formData.get("date") as string;
  const dueDate = (formData.get("dueDate") as string) || null;
  const paidAtStr = (formData.get("paidAt") as string) || null;
  const paidAt = paidAtStr ? new Date(paidAtStr) : null;
  const recurringPeriodRaw = (formData.get("recurringPeriod") as string) || null;
  const recurringPeriod = recurringPeriodRaw as
    | "monthly"
    | "quarterly"
    | "annual"
    | "one_time"
    | null;
  const notes = (formData.get("notes") as string)?.trim() || null;
  return { type, clientId, description, amountCents, date, dueDate, paidAt, recurringPeriod, notes };
}

export async function createFinancialEntry(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const fields = parseFields(formData);
  if (!fields.description) throw new Error("Description is required");
  if (!fields.date) throw new Error("Date is required");

  await db.insert(financialEntries).values({
    ...fields,
    createdBy: userId,
    updatedBy: userId,
    reviewedAt: new Date(),
  });
  revalidatePath("/financials");
  if (fields.clientId) revalidatePath(`/companies/${fields.clientId}`);
}

export async function updateFinancialEntry(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const fields = parseFields(formData);

  await db
    .update(financialEntries)
    .set({ ...fields, updatedBy: userId })
    .where(eq(financialEntries.id, id));
  revalidatePath("/financials");
  if (fields.clientId) revalidatePath(`/companies/${fields.clientId}`);
}

export async function deleteFinancialEntry(
  formData: FormData
): Promise<{ error: string } | undefined> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const [row] = await db
    .select({ clientId: financialEntries.clientId })
    .from(financialEntries)
    .where(eq(financialEntries.id, id))
    .limit(1);

  try {
    await db
      .update(financialEntries)
      .set({ deletedAt: new Date() })
      .where(eq(financialEntries.id, id));
  } catch (err) {
    if (isFKViolation(err)) {
      return { error: "Can't delete: this entry has linked records." };
    }
    throw err;
  }
  revalidatePath("/financials");
  if (row?.clientId) revalidatePath(`/companies/${row.clientId}`);
}

export async function markArPaid(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const [row] = await db
    .select({ clientId: financialEntries.clientId })
    .from(financialEntries)
    .where(eq(financialEntries.id, id))
    .limit(1);

  await db
    .update(financialEntries)
    .set({ paidAt: new Date(), updatedBy: userId })
    .where(eq(financialEntries.id, id));
  revalidatePath("/financials");
  if (row?.clientId) revalidatePath(`/companies/${row.clientId}`);
}
