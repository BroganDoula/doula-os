"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { ndas } from "@/db/schema";
import { isFKViolation } from "@/lib/db-errors";

function parseNdaFields(formData: FormData) {
  const companyId = (formData.get("companyId") as string).trim() || null;
  const engagementId = (formData.get("engagementId") as string).trim() || null;
  const signedDate = (formData.get("signedDate") as string) || null;
  const expirationDate = (formData.get("expirationDate") as string) || null;
  const bidirectional = formData.get("bidirectional") === "true";
  const notes = (formData.get("notes") as string).trim() || null;
  return { companyId, engagementId, signedDate, expirationDate, bidirectional, notes };
}

export async function createNda(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const counterparty = (formData.get("counterparty") as string).trim();
  if (!counterparty) throw new Error("Counterparty is required");

  const fields = parseNdaFields(formData);

  const file = formData.get("file") as File | null;
  const fileFields: { fileName?: string; fileData?: string; fileMimeType?: string } = {};
  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer();
    fileFields.fileData = Buffer.from(bytes).toString("base64");
    fileFields.fileName = file.name;
    fileFields.fileMimeType = file.type || undefined;
  }

  await db.insert(ndas).values({
    counterparty,
    clientId: fields.companyId,
    createdBy: userId,
    updatedBy: userId,
    reviewedAt: new Date(),
    ...fields,
    ...fileFields,
  });
  revalidatePath("/ndas");
  if (fields.companyId) revalidatePath(`/companies/${fields.companyId}`);
  if (fields.engagementId) revalidatePath(`/projects/${fields.engagementId}`);
}

export async function updateNda(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const counterparty = (formData.get("counterparty") as string).trim();
  if (!counterparty) throw new Error("Counterparty is required");

  const fields = parseNdaFields(formData);

  const file = formData.get("file") as File | null;
  const fileFields: { fileName?: string; fileData?: string; fileMimeType?: string } = {};
  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer();
    fileFields.fileData = Buffer.from(bytes).toString("base64");
    fileFields.fileName = file.name;
    fileFields.fileMimeType = file.type || undefined;
  }

  await db.update(ndas).set({
    counterparty,
    updatedBy: userId,
    ...fields,
    ...fileFields,
  }).where(eq(ndas.id, id));
  revalidatePath("/ndas");
  if (fields.companyId) revalidatePath(`/companies/${fields.companyId}`);
  if (fields.engagementId) revalidatePath(`/projects/${fields.engagementId}`);
}

export async function deleteNda(formData: FormData): Promise<{ error: string } | undefined> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const [row] = await db
    .select({ companyId: ndas.companyId, engagementId: ndas.engagementId })
    .from(ndas)
    .where(eq(ndas.id, id))
    .limit(1);

  try {
    await db.update(ndas).set({ deletedAt: new Date() }).where(eq(ndas.id, id));
  } catch (err) {
    if (isFKViolation(err)) {
      return { error: "Can't delete: this NDA has linked records. Remove those first." };
    }
    throw err;
  }
  revalidatePath("/ndas");
  if (row?.companyId) revalidatePath(`/companies/${row.companyId}`);
  if (row?.engagementId) revalidatePath(`/projects/${row.engagementId}`);
}
