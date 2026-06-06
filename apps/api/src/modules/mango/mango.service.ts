import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class MangoService {
  constructor(private prisma: PrismaService) {}

  async handleWebhook(payload: any) {
    const { call_id, from, to, date, duration, entry_result } = payload
    if (!call_id) return { ok: false }

    const direction = from?.type === 'internal' ? 'OUT' : 'IN'
    const phone = direction === 'IN' ? from?.number : to?.number

    const client = phone
      ? await this.prisma.client.findFirst({ where: { phone: { contains: phone.slice(-10) } } })
      : null

    await this.prisma.phoneCall.upsert({
      where: { externalId: call_id },
      create: {
        externalId: call_id,
        clientId: client?.id,
        direction,
        fromNumber: from?.number || '',
        toNumber: to?.number || '',
        duration: duration || 0,
        startedAt: new Date(date * 1000),
        recordingUrl: entry_result?.recording_url,
      },
      update: {
        duration: duration || 0,
        endedAt: new Date(),
        recordingUrl: entry_result?.recording_url,
      },
    })

    return { ok: true }
  }

  async getCalls(query: { clientId?: number; page?: number; limit?: number }) {
    const { clientId, page = 1, limit = 20 } = query
    const where: any = {}
    if (clientId) where.clientId = clientId

    const [data, total] = await this.prisma.$transaction([
      this.prisma.phoneCall.findMany({
        where,
        include: { client: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { startedAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      this.prisma.phoneCall.count({ where }),
    ])

    return { data, pagination: { page: Number(page), limit: Number(limit), total } }
  }
}
