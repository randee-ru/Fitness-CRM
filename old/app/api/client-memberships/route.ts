import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientMemberships = await prisma.clientMembership.findMany({
    include: {
      client: { select: { id: true, firstName: true, lastName: true, middleName: true } },
      membership: { select: { id: true, name: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, clientMemberships });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { clientId, membershipId, activationDate, sellerId } = body;

  if (!clientId || !membershipId) {
    return NextResponse.json({ error: "clientId и membershipId обязательны" }, { status: 400 });
  }

  const membership = await prisma.membership.findUnique({ where: { id: Number(membershipId) } });
  if (!membership) return NextResponse.json({ error: "Абонемент не найден" }, { status: 404 });

  const activation = activationDate ? new Date(activationDate) : new Date();
  const expiration = membership.daysValid
    ? new Date(activation.getTime() + membership.daysValid * 86_400_000)
    : null;

  const cm = await prisma.clientMembership.create({
    data: {
      clientId: Number(clientId),
      membershipId: Number(membershipId),
      sellerId: sellerId ? Number(sellerId) : null,
      saleDate: new Date(),
      activationDate: activation,
      expirationDate: expiration,
      originalExpirationDate: expiration,
      remainingVisits: membership.visitCount ?? null,
      status: "active",
    },
  });

  return NextResponse.json({ success: true, clientMembership: cm }, { status: 201 });
}
