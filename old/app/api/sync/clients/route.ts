import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getClientUsertoken, getClient, getTickets } from "@/lib/fitness1c";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  // phones: string[] — список телефонов для синхронизации
  const phones: string[] = body.phones ?? [];

  if (!phones.length) {
    return NextResponse.json({ error: "Нет телефонов для синхронизации" }, { status: 400 });
  }

  const results = { synced: 0, failed: 0, errors: [] as string[] };

  for (const rawPhone of phones) {
    // Нормализуем телефон: убираем пробелы, скобки, тире
    const phone = rawPhone.replace(/[\s\-\(\)]/g, "");

    try {
      // 1. Получаем usertoken клиента по телефону
      const usertoken = await getClientUsertoken(phone);
      if (!usertoken) {
        results.failed++;
        results.errors.push(`${phone}: токен не найден`);
        continue;
      }

      // 2. Получаем полные данные клиента из 1С
      const fc = await getClient(usertoken);

      // 3. Получаем абонементы клиента
      const tickets = await getTickets(usertoken).catch(() => []);

      // 4. Определяем пол
      const gender = fc.sex === 1 ? "Мужской" : fc.sex === 2 ? "Женский" : null;

      // 5. Данные карт
      const cardData = fc.cards.length > 0
        ? JSON.stringify({ number: fc.cards[0].card_code, cardId: fc.cards[0].id })
        : null;

      // 6. Теги
      const tagsJson = fc.tags.length > 0
        ? JSON.stringify(fc.tags.map(t => t.title))
        : null;

      // 7. Upsert клиента в локальную БД
      // Ищем по fitnessId (1С ID) или по телефону
      const existing = await prisma.user.findFirst({
        where: { OR: [{ fitnessId: fc.id }, { phone: fc.phone }] },
      });

      const userData = {
        fitnessId: fc.id,
        firstName: fc.name || null,
        lastName: fc.last_name || null,
        middleName: fc.second_name || null,
        phone: fc.phone,
        email: fc.email || null,
        birthDate: fc.birthday ? new Date(fc.birthday) : null,
        gender,
        card: cardData,
        tags: tagsJson,
        role: "клиент",
        isActive: true,
      };

      let dbUser: { id: number };
      if (existing) {
        dbUser = await prisma.user.update({
          where: { id: existing.id },
          data: userData,
        });
      } else {
        dbUser = await prisma.user.create({ data: userData });
      }

      // 8. Синхронизируем активные абонементы
      for (const ticket of tickets) {
        if (ticket.status !== "active") continue;

        // Ищем или создаём тип абонемента
        let membership = await prisma.membership.findFirst({
          where: { name: ticket.title },
        });

        if (!membership) {
          membership = await prisma.membership.create({
            data: {
              name: ticket.title,
              type: ticket.type === "membership" ? "unlimited" : "visits",
              price: 0, // цена неизвестна из API
              isActive: true,
              extra: JSON.stringify({ fitnessTicketId: ticket.item_id }),
            },
          });
        }

        // Upsert клиентского абонемента по fitnessTicketId
        const existingCm = await prisma.clientMembership.findFirst({
          where: {
            clientId: dbUser.id,
            extra: { contains: ticket.ticket_id },
          },
        });

        if (!existingCm) {
          await prisma.clientMembership.create({
            data: {
              clientId: dbUser.id,
              membershipId: membership.id,
              status: "active",
              saleDate: new Date(),
              expirationDate: ticket.end_date ? new Date(ticket.end_date) : null,
              extra: JSON.stringify({ fitnessTicketId: ticket.ticket_id }),
            },
          });
        }
      }

      results.synced++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`${phone}: ${err.message}`);
    }
  }

  return NextResponse.json({ success: true, ...results });
}
