import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const visit = await prisma.clientVisit.update({
    where: { id: Number(id) },
    data: { checkOutTime: new Date() },
  });

  return NextResponse.json({ success: true, visit });
}
