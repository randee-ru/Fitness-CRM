import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const types = await prisma.membershipType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ membershipTypes: types });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, code, description, requiresVisitCount, requiresDaysValid } = body;

  if (!name?.trim() || !code?.trim()) {
    return NextResponse.json({ error: "name и code обязательны" }, { status: 400 });
  }

  const type = await prisma.membershipType.create({
    data: {
      name: name.trim(),
      code: code.trim().toLowerCase(),
      description: description?.trim() || null,
      requiresVisitCount: requiresVisitCount ?? false,
      requiresDaysValid: requiresDaysValid ?? true,
    },
  });

  return NextResponse.json({ success: true, membershipType: type }, { status: 201 });
}
