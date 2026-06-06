import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mapUserToClient } from "@/lib/client-mapper";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ client: mapUserToClient(user) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const allowed = [
    "firstName", "middleName", "lastName", "phone", "email",
    "birthDate", "gender", "address", "telegram", "instagram",
    "heightCm", "weightKg", "balance", "notes", "interests",
    "jobTitle", "children", "tags", "isActive", "personalManagerId",
  ];

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      if (key === "birthDate") {
        data[key] = body[key] ? new Date(body[key]) : null;
      } else if (key === "tags" && Array.isArray(body[key])) {
        data[key] = JSON.stringify(body[key]);
      } else {
        data[key] = body[key];
      }
    }
  }

  const user = await prisma.user.update({ where: { id: Number(id) }, data });
  return NextResponse.json({ success: true, client: mapUserToClient(user) });
}
