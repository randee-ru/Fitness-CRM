import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { resolveName } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const users = await prisma.user.findMany({
    where: {
      role: "клиент",
      OR: [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { middleName: { contains: q } },
        { phone: { contains: q } },
      ],
    },
    take: 10,
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: resolveName(u),
      phone: u.phone ?? "",
      cardNumber: (() => {
        try { return u.card ? JSON.parse(u.card)?.number ?? null : null; } catch { return null; }
      })(),
    }))
  );
}
