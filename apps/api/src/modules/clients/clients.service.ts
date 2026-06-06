import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateClientDto, UpdateClientDto, ClientQueryDto } from './dto/create-client.dto'

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ClientQueryDto) {
    const { search, page = 1, limit = 20, isActive } = query
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (isActive !== undefined) where.isActive = isActive
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, firstName: true, lastName: true, middleName: true,
          phone: true, email: true, photoUrl: true, isActive: true, balance: true,
          registrationDate: true,
          memberships: {
            where: { status: 'ACTIVE' },
            take: 1,
            select: { id: true, membership: { select: { name: true } }, expirationDate: true, status: true },
          },
        },
      }),
      this.prisma.client.count({ where }),
    ])

    return {
      data,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    }
  }

  async findOne(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        memberships: { include: { membership: true }, orderBy: { createdAt: 'desc' } },
        visits: { orderBy: { checkInTime: 'desc' }, take: 20 },
        rfidKeys: { where: { isActive: true } },
        loyaltyAccount: true,
        clientNotes: { orderBy: { createdAt: 'desc' }, take: 10 },
        phoneCalls: { orderBy: { startedAt: 'desc' }, take: 10 },
        deals: { include: { stage: true, pipeline: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })
    if (!client) throw new NotFoundException(`Клиент #${id} не найден`)
    return client
  }

  async create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: { ...dto, birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined } })
  }

  async update(id: number, dto: UpdateClientDto) {
    await this.findOne(id)
    return this.prisma.client.update({
      where: { id },
      data: { ...dto, birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined },
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.client.update({ where: { id }, data: { isActive: false } })
  }

  async getStats() {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const [total, active, newThisMonth, inClubNow] = await this.prisma.$transaction([
      this.prisma.client.count(),
      this.prisma.client.count({ where: { isActive: true } }),
      this.prisma.client.count({ where: { registrationDate: { gte: startOfMonth } } }),
      this.prisma.clientVisit.count({ where: { status: 'ACTIVE' } }),
    ])
    return { total, active, newThisMonth, inClubNow }
  }
}
