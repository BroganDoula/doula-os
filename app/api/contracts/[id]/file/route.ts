import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { contracts } from "@/db/schema";
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
    .select({ fileData: contracts.fileData, fileName: contracts.fileName })
    .from(contracts)
    .where(eq(contracts.id, id))
    .limit(1);

  const contract = rows[0];
  if (!contract?.fileData) return new NextResponse("Not Found", { status: 404 });

  const buffer = Buffer.from(contract.fileData, "base64");
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${contract.fileName}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
