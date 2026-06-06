import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      firstName: "Администратор",
      lastName: "Системы",
      role: "админ",
      email: "admin@fitness.local",
      isActive: true,
    },
  });

  await prisma.account.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: await bcrypt.hash("admin123", 12),
      userId: adminUser.id,
    },
  });

  // Membership types
  const types = await Promise.all([
    prisma.membershipType.upsert({ where: { code: "standard" }, update: {}, create: { name: "Стандартный", code: "standard", requiresDaysValid: true } }),
    prisma.membershipType.upsert({ where: { code: "visit" }, update: {}, create: { name: "По посещениям", code: "visit", requiresVisitCount: true, requiresDaysValid: false } }),
    prisma.membershipType.upsert({ where: { code: "unlimited" }, update: {}, create: { name: "Безлимит", code: "unlimited", requiresDaysValid: true } }),
  ]);

  // Membership plans
  await Promise.all([
    prisma.membership.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: "Разовое посещение", type: "visits", price: 500, visitCount: 1, membershipTypeId: types[1].id } }),
    prisma.membership.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name: "Абонемент на месяц", type: "daily", price: 3500, daysValid: 30, membershipTypeId: types[0].id } }),
    prisma.membership.upsert({ where: { id: 3 }, update: {}, create: { id: 3, name: "Абонемент на 3 месяца", type: "daily", price: 9000, daysValid: 90, membershipTypeId: types[0].id } }),
    prisma.membership.upsert({ where: { id: 4 }, update: {}, create: { id: 4, name: "Безлимит год", type: "unlimited", price: 25000, daysValid: 365, membershipTypeId: types[2].id } }),
    prisma.membership.upsert({ where: { id: 5 }, update: {}, create: { id: 5, name: "10 посещений", type: "visits", price: 4000, visitCount: 10, membershipTypeId: types[1].id } }),
  ]);

  // Demo clients
  const demoClients = [
    { firstName: "Иван", lastName: "Иванов", phone: "+79001112233", email: "ivan@example.com" },
    { firstName: "Мария", lastName: "Петрова", phone: "+79002223344", email: "maria@example.com" },
    { firstName: "Алексей", lastName: "Сидоров", phone: "+79003334455" },
    { firstName: "Анна", lastName: "Козлова", phone: "+79004445566", email: "anna@example.com" },
    { firstName: "Дмитрий", lastName: "Новиков", phone: "+79005556677" },
  ];

  for (const [i, client] of demoClients.entries()) {
    await prisma.user.upsert({
      where: { id: 10 + i },
      update: {},
      create: { id: 10 + i, ...client, role: "клиент", isActive: true, registrationDate: new Date() },
    });
  }

  console.log("✅ Seed complete!");
  console.log("   Login: admin / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
