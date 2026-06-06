import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.membership.findMany({
    where: { isActive: true },
    include: { membershipType: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ memberships });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, type, price, description, daysValid, visitCount, validUntilTime, membershipTypeId, isPromotional } = body;

  if (!name?.trim() || !type || price == null) {
    return NextResponse.json({ error: "name, type, price обязательны" }, { status: 400 });
  }

  const m = await prisma.membership.create({
    data: {
      name: name.trim(),
      type,
      price: Number(price),
      description: description?.trim() || null,
      daysValid: daysValid ? Number(daysValid) : null,
      visitCount: visitCount ? Number(visitCount) : null,
      validUntilTime: validUntilTime || null,
      membershipTypeId: membershipTypeId ? Number(membershipTypeId) : null,
      isPromotional: isPromotional ?? false,
    },
  });

  return NextResponse.json({ success: true, membership: m }, { status: 201 });
}
