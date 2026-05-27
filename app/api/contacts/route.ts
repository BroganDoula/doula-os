import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contacts } from "@/db/schema";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const rows = await db.select().from(contacts).orderBy(contacts.createdAt);
  return Response.json(rows);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const { name, email, company } = body;

  if (!name) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const [created] = await db
    .insert(contacts)
    .values({ name, email, company })
    .returning();

  return Response.json(created, { status: 201 });
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await request.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  await db.delete(contacts).where(eq(contacts.id, id));
  return new Response(null, { status: 204 });
}
