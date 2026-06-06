import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { clientId: Number(clientId) },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, text, managerId } = await req.json();
  if (!clientId || !text?.trim()) {
    return NextResponse.json({ error: "clientId и text обязательны" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      clientId: Number(clientId),
      text: text.trim(),
      managerId: managerId ? Number(managerId) : null,
    },
  });

  return NextResponse.json({ success: true, comment }, { status: 201 });
}
