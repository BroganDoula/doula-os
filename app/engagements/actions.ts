"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { engagements, proposals, deliverables, engagementPhaseEnum } from "@/db/schema";

type Phase = typeof engagementPhaseEnum.enumValues[number];
type Status = "active" | "paused" | "complete";

// ── Engagements ───────────────────────────────────────────────────────────────

export async function createEngagement(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const companyId = (formData.get("companyId") as string).trim();
  if (!companyId) throw new Error("Company is required");

  const name = (formData.get("name") as string).trim();
  if (!name) throw new Error("Name is required");

  const phase = ((formData.get("phase") as string) || "definition") as Phase;
  const rateRaw = (formData.get("rate") as string).trim();
  const rateCents = rateRaw ? Math.round(parseFloat(rateRaw) * 100) : null;
  const weeklyHoursRaw = (formData.get("weeklyHours") as string).trim();
  const weeklyHourCommitment = weeklyHoursRaw ? parseInt(weeklyHoursRaw, 10) : null;
  const startedAt = (formData.get("startedAt") as string) || null;
  const status = ((formData.get("status") as string) || "active") as "active" | "paused" | "complete";
  const notes = (formData.get("notes") as string).trim() || null;

  await db.insert(engagements).values({
    companyId,
    clientId: companyId,
    name,
    phase,
    rateCents,
    weeklyHourCommitment,
    startedAt,
    status,
    notes,
  });
  revalidatePath("/engagements");
}

export async function updateEngagement(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const companyId = (formData.get("companyId") as string).trim();
  if (!companyId) throw new Error("Company is required");
  const name = (formData.get("name") as string).trim();
  if (!name) throw new Error("Name is required");

  const phase = ((formData.get("phase") as string) || "definition") as Phase;
  const rateRaw = (formData.get("rate") as string).trim();
  const rateCents = rateRaw ? Math.round(parseFloat(rateRaw) * 100) : null;
  const weeklyHoursRaw = (formData.get("weeklyHours") as string).trim();
  const weeklyHourCommitment = weeklyHoursRaw ? parseInt(weeklyHoursRaw, 10) : null;
  const startedAt = (formData.get("startedAt") as string) || null;
  const status = ((formData.get("status") as string) || "active") as Status;
  const notes = (formData.get("notes") as string).trim() || null;

  await db.update(engagements).set({
    companyId, clientId: companyId, name, phase, rateCents,
    weeklyHourCommitment, startedAt, status, notes,
  }).where(eq(engagements.id, id));
  revalidatePath("/engagements");
}

export async function deleteEngagement(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  await db.delete(engagements).where(eq(engagements.id, id));
  revalidatePath("/engagements");
}

// ── Proposals ─────────────────────────────────────────────────────────────────

export async function createProposal(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const engagementId = formData.get("engagementId") as string;
  const clientId = formData.get("clientId") as string;
  const file = formData.get("file") as File;
  if (!file || file.size === 0) throw new Error("File is required");

  const bytes = await file.arrayBuffer();
  const fileData = Buffer.from(bytes).toString("base64");

  await db.insert(proposals).values({ engagementId, clientId, fileName: file.name, fileData, fileMimeType: file.type || null });
  revalidatePath(`/engagements/${engagementId}`);
}

export async function deleteProposal(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const engagementId = formData.get("engagementId") as string;
  await db.delete(proposals).where(eq(proposals.id, id));
  revalidatePath(`/engagements/${engagementId}`);
}

// ── Deliverables ──────────────────────────────────────────────────────────────

export async function createDeliverable(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const title = (formData.get("title") as string).trim();
  if (!title) throw new Error("Title is required");

  const engagementId = formData.get("engagementId") as string;
  const proposalId = formData.get("proposalId") as string;
  const clientId = formData.get("clientId") as string;
  const dueDate = (formData.get("dueDate") as string) || null;

  await db.insert(deliverables).values({ engagementId, proposalId, clientId, title, dueDate });
  revalidatePath(`/engagements/${engagementId}`);
}

export async function updateDeliverable(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const engagementId = formData.get("engagementId") as string;
  const title = (formData.get("title") as string).trim();
  if (!title) throw new Error("Title is required");
  const proposalId = (formData.get("proposalId") as string) || null;
  const dueDate = (formData.get("dueDate") as string) || null;

  await db.update(deliverables).set({ title, proposalId, dueDate }).where(eq(deliverables.id, id));
  revalidatePath(`/engagements/${engagementId}`);
}

export async function deleteDeliverable(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const engagementId = formData.get("engagementId") as string;
  await db.delete(deliverables).where(eq(deliverables.id, id));
  revalidatePath(`/engagements/${engagementId}`);
}

export async function toggleDeliverable(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const engagementId = formData.get("engagementId") as string;
  const currentStatus = formData.get("currentStatus") as string;
  const newStatus = currentStatus === "complete" ? "pending" : "complete";

  await db
    .update(deliverables)
    .set({
      status: newStatus as "pending" | "in_progress" | "complete",
      completedAt: newStatus === "complete" ? new Date() : null,
    })
    .where(eq(deliverables.id, id));
  revalidatePath(`/engagements/${engagementId}`);
}
