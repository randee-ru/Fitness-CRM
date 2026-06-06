import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, membershipId, membershipType } = await req.json();

  if (!clientId) {
    return NextResponse.json({ success: false, message: "clientId обязателен" }, { status: 400 });
  }

  const client = await prisma.user.findUnique({ where: { id: Number(clientId) } });
  if (!client) {
    return NextResponse.json({ success: false, message: "Клиент не найден" }, { status: 404 });
  }

  // Проверяем активный абонемент
  const activeMembership = await prisma.clientMembership.findFirst({
    where: { clientId: Number(clientId), status: "active" },
    include: { membership: true },
    orderBy: { createdAt: "desc" },
  });

  if (activeMembership?.frozenAt && !activeMembership?.unfrozenAt) {
    return NextResponse.json({
      success: false,
      frozen: true,
      message: `Абонемент клиента заморожен. Причина: ${activeMembership.freezeReason || "не указана"}`,
    });
  }

  // Проверяем, не в клубе ли уже
  const alreadyIn = await prisma.clientVisit.findFirst({
    where: { clientId: Number(clientId), checkOutTime: null },
  });

  if (alreadyIn) {
    return NextResponse.json({ success: false, message: "Клиент уже в клубе" });
  }

  const visit = await prisma.clientVisit.create({
    data: {
      clientId: Number(clientId),
      membershipId: membershipId ? String(membershipId) : null,
      membershipType: membershipType
        ? String(membershipType)
        : activeMembership?.membership.name ?? null,
      checkInTime: new Date(),
    },
  });

  return NextResponse.json({ success: true, visitId: visit.id });
}
