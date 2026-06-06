import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mapUserToClient } from "@/lib/client-mapper";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q")?.trim();

  const users = await prisma.user.findMany({
    where: {
      role: "клиент",
      ...(search && {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { middleName: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } },
        ],
      }),
    },
    orderBy: { id: "desc" },
  });

  return NextResponse.json({ clients: users.map(mapUserToClient) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { firstName, middleName, lastName, phone, email, birthDate, gender, role } = body;

  if (!firstName?.trim()) {
    return NextResponse.json({ error: "Имя обязательно" }, { status: 400 });
  }
  if (!phone?.trim()) {
    return NextResponse.json({ error: "Телефон обязателен" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({ where: { phone: phone.trim() } });
  if (existing) {
    return NextResponse.json({ error: "Клиент с таким телефоном уже существует" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      firstName: firstName.trim(),
      middleName: middleName?.trim() || null,
      lastName: lastName?.trim() || null,
      phone: phone.trim(),
      email: email?.trim() || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      gender: gender || null,
      role: role || "клиент",
      isActive: true,
      registrationDate: new Date(),
    },
  });

  return NextResponse.json({ success: true, client: { id: user.id } }, { status: 201 });
}
