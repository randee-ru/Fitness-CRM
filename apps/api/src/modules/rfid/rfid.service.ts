import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class RfidService {
  constructor(private prisma: PrismaService) {}

  async issueKey(clientId: number, data: { code: string; type: string; label?: string }) {
    await this.prisma.rfidKey.updateMany({ where: { clientId, isActive: true }, data: { isActive: false, revokedAt: new Date() } })
    return this.prisma.rfidKey.create({
      data: { clientId, ...data },
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
    })
  }

  async revokeKey(id: number) {
    return this.prisma.rfidKey.update({ where: { id }, data: { isActive: false, revokedAt: new Date() } })
  }

  async processAccess(code: string, zone: string, deviceId?: string) {
    const key = await this.prisma.rfidKey.findUnique({
      where: { code },
      include: {
        client: {
          include: {
            memberships: { where: { status: 'ACTIVE' }, take: 1 },
          },
        },
      },
    })

    let granted = false
    let reason: string | undefined

    if (!key || !key.isActive) {
      reason = 'RFID ключ не найден или заблокирован'
    } else if (!key.client.isActive) {
      reason = 'Клиент деактивирован'
    } else if (key.client.memberships.length === 0) {
      reason = 'Нет активного абонемента'
    } else {
      granted = true
    }

    await this.prisma.accessEvent.create({
      data: { rfidKeyId: key?.id, type: granted ? 'ENTRY' : 'DENIED', zone, deviceId, granted, reason },
    })

    return { granted, reason, client: granted ? { id: key!.client.id, firstName: key!.client.firstName, lastName: key!.client.lastName } : null }
  }

  async getClientKeys(clientId: number) {
    return this.prisma.rfidKey.findMany({ where: { clientId }, orderBy: { issuedAt: 'desc' } })
  }

  async getAccessEvents(query: { clientId?: number; zone?: string; limit?: number }) {
    const { limit = 50 } = query
    return this.prisma.accessEvent.findMany({
      include: { rfidKey: { include: { client: { select: { id: true, firstName: true, lastName: true } } } } },
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
    })
  }
}
