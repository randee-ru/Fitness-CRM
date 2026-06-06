import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { resolveName } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const visits = await prisma.clientVisit.findMany({
    where: { checkOutTime: null },
    include: { client: true },
    orderBy: { checkInTime: "asc" },
  });

  const clients = visits.map((v) => ({
    id: v.client.id,
    visitId: v.id,
    name: resolveName(v.client),
    membership: v.membershipType ?? "Не указан",
    checkInTime: v.checkInTime.toISOString(),
    validUntilTime: null,
  }));

  return NextResponse.json({ clients, count: clients.length });
}
