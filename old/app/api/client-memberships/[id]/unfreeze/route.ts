import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const cm = await prisma.clientMembership.findUnique({ where: { id: Number(id) } });
  if (!cm) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const frozeAt = cm.frozenAt ? new Date(cm.frozenAt) : new Date();
  const frozenDays = Math.ceil((Date.now() - frozeAt.getTime()) / 86_400_000);
  const totalFreeze = cm.freezeDays + frozenDays;

  const newExpiration = cm.expirationDate
    ? new Date(new Date(cm.expirationDate).getTime() + frozenDays * 86_400_000)
    : null;

  const updated = await prisma.clientMembership.update({
    where: { id: Number(id) },
    data: {
      status: "active",
      unfrozenAt: new Date(),
      freezeDays: totalFreeze,
      expirationDate: newExpiration,
    },
  });

  return NextResponse.json({ success: true, clientMembership: updated });
}
