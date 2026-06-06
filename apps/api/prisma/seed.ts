import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const passwordHash = await bcrypt.hash('admin123', 12)

  await prisma.staff.upsert({
    where: { email: 'admin@sportmax.ru' },
    update: {},
    create: {
      email: 'admin@sportmax.ru',
      passwordHash,
      role: 'ADMIN',
      firstName: 'Администратор',
      lastName: 'SportMax',
    },
  })

  await prisma.staff.upsert({
    where: { email: 'manager@sportmax.ru' },
    update: {},
    create: {
      email: 'manager@sportmax.ru',
      passwordHash: await bcrypt.hash('manager123', 12),
      role: 'MANAGER',
      firstName: 'Менеджер',
      lastName: 'Иванов',
    },
  })

  await prisma.staff.upsert({
    where: { email: 'reception@sportmax.ru' },
    update: {},
    create: {
      email: 'reception@sportmax.ru',
      passwordHash: await bcrypt.hash('reception123', 12),
      role: 'RECEPTION',
      firstName: 'Ресепшен',
      lastName: 'Петрова',
    },
  })

  const membershipType = await prisma.membershipType.upsert({
    where: { code: 'standard' },
    update: {},
    create: { name: 'Стандарт', code: 'standard', color: '#6366f1' },
  })

  await prisma.membership.createMany({
    skipDuplicates: true,
    data: [
      { membershipTypeId: membershipType.id, name: 'Месяц безлимит', price: 3500, daysValid: 30, freezeDaysAllowed: 14 },
      { membershipTypeId: membershipType.id, name: '3 месяца безлимит', price: 9000, daysValid: 90, freezeDaysAllowed: 30 },
      { membershipTypeId: membershipType.id, name: '10 посещений', price: 2500, visitCount: 10, daysValid: 60 },
    ],
  })

  const pipeline = await prisma.pipeline.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Продажи абонементов',
      isDefault: true,
      stages: {
        create: [
          { name: 'Новый лид', color: '#6366f1', sortOrder: 0 },
          { name: 'Консультация', color: '#f59e0b', sortOrder: 1 },
          { name: 'Пробное занятие', color: '#3b82f6', sortOrder: 2 },
          { name: 'Коммерческое предложение', color: '#8b5cf6', sortOrder: 3 },
          { name: 'Успешно', color: '#10b981', sortOrder: 4, isWon: true },
          { name: 'Отказ', color: '#ef4444', sortOrder: 5, isLost: true },
        ],
      },
    },
  })

  await prisma.loyaltyProgram.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'SportMax Rewards',
      description: 'Накапливай баллы за каждую покупку',
      pointsName: 'баллы',
      earnRate: 10,
      spendRate: 1,
      levels: [
        { name: 'Бронза', minPoints: 0, discount: 0 },
        { name: 'Серебро', minPoints: 500, discount: 5 },
        { name: 'Золото', minPoints: 2000, discount: 10 },
        { name: 'Платина', minPoints: 5000, discount: 15 },
      ],
    },
  })

  await prisma.classType.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Йога', color: '#10b981', duration: 60 },
      { name: 'Силовая', color: '#ef4444', duration: 60 },
      { name: 'Кардио', color: '#f59e0b', duration: 45 },
      { name: 'Растяжка', color: '#6366f1', duration: 30 },
      { name: 'Пилатес', color: '#8b5cf6', duration: 60 },
      { name: 'Зумба', color: '#ec4899', duration: 60 },
    ],
  })

  console.log('✅ Seed completed!')
  console.log('👤 admin@sportmax.ru / admin123')
  console.log('👤 manager@sportmax.ru / manager123')
  console.log('👤 reception@sportmax.ru / reception123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
