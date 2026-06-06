import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class VisitsService {
  constructor(private prisma: PrismaService) {}

  async checkIn(clientId: number, staffId?: number) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } })
    if (!client) throw new NotFoundException(`Клиент #${clientId} не найден`)
    if (!client.isActive) throw new BadRequestException('Клиент деактивирован')

    const existing = await this.prisma.clientVisit.findFirst({
      where: { clientId, status: 'ACTIVE' },
    })
    if (existing) throw new BadRequestException('Клиент уже в клубе')

    return this.prisma.clientVisit.create({
      data: { clientId, checkedInById: staffId, status: 'ACTIVE' },
      include: { client: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
    })
  }

  async checkOut(visitId: number) {
    const visit = await this.prisma.clientVisit.findUnique({ where: { id: visitId } })
    if (!visit) throw new NotFoundException(`Визит #${visitId} не найден`)
    if (visit.status !== 'ACTIVE') throw new BadRequestException('Визит уже завершён')

    const duration = Math.round((Date.now() - visit.checkInTime.getTime()) / 60000)
    return this.prisma.clientVisit.update({
      where: { id: visitId },
      data: { checkOutTime: new Date(), status: duration > 180 ? 'OVERSTAY' : 'COMPLETED' },
    })
  }

  async getClientsInClub() {
    return this.prisma.clientVisit.findMany({
      where: { status: 'ACTIVE' },
      include: {
        client: {
          select: {
            id: true, firstName: true, lastName: true, photoUrl: true, phone: true,
            memberships: { where: { status: 'ACTIVE' }, take: 1, select: { membership: { select: { name: true } } } },
          },
        },
      },
      orderBy: { checkInTime: 'asc' },
    })
  }

  async getHistory(query: { clientId?: number; page?: number; limit?: number }) {
    const { clientId, page = 1, limit = 20 } = query
    const where: any = {}
    if (clientId) where.clientId = clientId

    const [data, total] = await this.prisma.$transaction([
      this.prisma.clientVisit.findMany({
        where,
        include: { client: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { checkInTime: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      this.prisma.clientVisit.count({ where }),
    ])

    return { data, pagination: { page: Number(page), limit: Number(limit), total } }
  }

  async searchForCheckIn(query: string) {
    return this.prisma.client.findMany({
      where: {
        isActive: true,
        OR: [
          { phone: { contains: query } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true, firstName: true, lastName: true, phone: true, photoUrl: true,
        memberships: { where: { status: 'ACTIVE' }, take: 1, select: { membership: { select: { name: true } }, expirationDate: true } },
        rfidKeys: { where: { isActive: true }, select: { code: true, type: true } },
      },
      take: 10,
    })
  }
}
