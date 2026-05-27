"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { contracts } from "@/db/schema";

function parseContractFields(formData: FormData) {
  const engagementId = (formData.get("engagementId") as string).trim() || null;
  const signedDate = (formData.get("signedDate") as string) || null;
  const termRaw = (formData.get("termMonths") as string).trim();
  const termMonths = termRaw ? parseInt(termRaw, 10) : null;
  const valueRaw = (formData.get("value") as string).trim();
  const valueCents = valueRaw ? Math.round(parseFloat(valueRaw) * 100) : null;
  const notes = (formData.get("notes") as string).trim() || null;
  return { engagementId, signedDate, termMonths, valueCents, notes };
}

export async function createContract(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const companyId = (formData.get("companyId") as string).trim();
  if (!companyId) throw new Error("Company is required");

  const file = formData.get("file") as File;
  if (!file || file.size === 0) throw new Error("File is required");

  const bytes = await file.arrayBuffer();
  const fileData = Buffer.from(bytes).toString("base64");

  const fields = parseContractFields(formData);

  await db.insert(contracts).values({
    companyId,
    clientId: companyId,
    fileName: file.name,
    fileData,
    fileMimeType: file.type || null,
    createdBy: userId,
    updatedBy: userId,
    reviewedAt: new Date(),
    ...fields,
  });
  revalidatePath("/contracts");
  revalidatePath(`/companies/${companyId}`);
  if (fields.engagementId) revalidatePath(`/projects/${fields.engagementId}`);
}

export async function updateContract(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const companyId = (formData.get("companyId") as string).trim();
  if (!companyId) throw new Error("Company is required");

  const file = formData.get("file") as File | null;
  const fileFields: { fileName?: string; fileData?: string; fileMimeType?: string } = {};
  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer();
    fileFields.fileData = Buffer.from(bytes).toString("base64");
    fileFields.fileName = file.name;
    fileFields.fileMimeType = file.type || undefined;
  }

  const fields = parseContractFields(formData);

  await db.update(contracts).set({
    companyId,
    clientId: companyId,
    ...fileFields,
    updatedBy: userId,
    ...fields,
  }).where(eq(contracts.id, id));
  revalidatePath("/contracts");
  revalidatePath(`/companies/${companyId}`);
  if (fields.engagementId) revalidatePath(`/projects/${fields.engagementId}`);
}

export async function deleteContract(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  // Look up FK targets before soft-deleting so we can revalidate the right pages
  const [row] = await db
    .select({ companyId: contracts.companyId, engagementId: contracts.engagementId })
    .from(contracts)
    .where(eq(contracts.id, id))
    .limit(1);

  await db.update(contracts).set({ deletedAt: new Date() }).where(eq(contracts.id, id));
  revalidatePath("/contracts");
  if (row?.companyId) revalidatePath(`/companies/${row.companyId}`);
  if (row?.engagementId) revalidatePath(`/projects/${row.engagementId}`);
}
