import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getClientUsertoken, getClient, getTickets } from "@/lib/fitness1c";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phones } = await req.json();
  const list: string[] = phones ?? [];

  const results = { synced: 0, updated: 0, failed: 0, clients: [] as any[], errors: [] as string[] };

  for (const raw of list) {
    const phone = raw.replace(/[\s\-\(\)]/g, "").replace(/^8/, "+7");

    try {
      const usertoken = await getClientUsertoken(phone);
      if (!usertoken) {
        results.failed++;
        results.errors.push(`${phone}: не найден в 1С`);
        continue;
      }

      const fc = await getClient(usertoken);
      const tickets = await getTickets(usertoken).catch(() => []);

      const gender = fc.sex === 1 ? "Мужской" : fc.sex === 2 ? "Женский" : null;
      const cardData = fc.cards?.length > 0
        ? JSON.stringify({ number: fc.cards[0].card_code, cardId: fc.cards[0].id })
        : null;
      const tagsJson = fc.tags?.length > 0
        ? JSON.stringify(fc.tags.map((t: any) => t.title))
        : null;

      const existing = await prisma.user.findFirst({
        where: { OR: [{ fitnessId: fc.id }, { phone: fc.phone }] },
      });

      const data = {
        fitnessId: fc.id,
        firstName: fc.name || null,
        lastName: fc.last_name || null,
        middleName: fc.second_name || null,
        phone: fc.phone,
        email: fc.email || null,
        birthDate: fc.birthday ? new Date(fc.birthday) : null,
        gender, card: cardData, tags: tagsJson,
        role: "клиент", isActive: true,
      };

      const user = existing
        ? await prisma.user.update({ where: { id: existing.id }, data })
        : await prisma.user.create({ data });

      // Синхронизируем активные абонементы
      for (const ticket of tickets.filter((t: any) => t.status === "active")) {
        let membership = await prisma.membership.findFirst({ where: { name: ticket.title } });
        if (!membership) {
          membership = await prisma.membership.create({
            data: { name: ticket.title, type: "unlimited", price: 0, isActive: true, extra: JSON.stringify({ fitnessItemId: ticket.item_id }) },
          });
        }
        const cmExists = await prisma.clientMembership.findFirst({
          where: { clientId: user.id, extra: { contains: ticket.ticket_id } },
        });
        if (!cmExists) {
          await prisma.clientMembership.create({
            data: {
              clientId: user.id,
              membershipId: membership.id,
              status: "active",
              saleDate: new Date(),
              expirationDate: ticket.end_date ? new Date(ticket.end_date) : null,
              extra: JSON.stringify({ fitnessTicketId: ticket.ticket_id }),
            },
          });
        }
      }

      if (existing) results.updated++; else results.synced++;
      results.clients.push({
        id: user.id,
        name: [fc.last_name, fc.name, fc.second_name].filter(Boolean).join(" "),
        phone: fc.phone,
        tickets: tickets.length,
      });
    } catch (err: any) {
      results.failed++;
      results.errors.push(`${phone}: ${err.message}`);
    }
  }

  return NextResponse.json({ success: true, ...results });
}
