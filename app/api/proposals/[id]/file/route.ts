import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { proposals } from "@/db/schema";
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
    .select({ fileData: proposals.fileData, fileName: proposals.fileName, fileMimeType: proposals.fileMimeType })
    .from(proposals)
    .where(eq(proposals.id, id))
    .limit(1);

  const proposal = rows[0];
  if (!proposal?.fileData) return new NextResponse("Not Found", { status: 404 });

  const buffer = Buffer.from(proposal.fileData, "base64");
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": proposal.fileMimeType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${proposal.fileName}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
