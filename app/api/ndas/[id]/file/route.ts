import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { ndas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const rows = await db
    .select({ fileData: ndas.fileData, fileName: ndas.fileName, fileMimeType: ndas.fileMimeType })
    .from(ndas)
    .where(eq(ndas.id, id))
    .limit(1);

  const nda = rows[0];
  if (!nda?.fileData) return new NextResponse("Not Found", { status: 404 });

  const buffer = Buffer.from(nda.fileData, "base64");
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": nda.fileMimeType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${nda.fileName ?? "nda"}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
