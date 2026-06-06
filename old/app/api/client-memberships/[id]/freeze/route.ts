import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { reason } = await req.json();

  const cm = await prisma.clientMembership.update({
    where: { id: Number(id) },
    data: { status: "frozen", frozenAt: new Date(), freezeReason: reason ?? null },
  });

  return NextResponse.json({ success: true, clientMembership: cm });
}
