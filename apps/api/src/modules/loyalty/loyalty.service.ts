import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  async getPrograms() {
    return this.prisma.loyaltyProgram.findMany({ where: { isActive: true } })
  }

  async getClientLoyalty(clientId: number) {
    return this.prisma.clientLoyalty.upsert({
      where: { clientId },
      create: { clientId },
      update: {},
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
    })
  }

  async addPoints(clientId: number, points: number, description?: string, referenceId?: number, referenceType?: string) {
    const loyalty = await this.getClientLoyalty(clientId)
    const newBalance = loyalty.points + points
    const [updated, tx] = await this.prisma.$transaction([
      this.prisma.clientLoyalty.update({
        where: { clientId },
        data: { points: newBalance, totalEarned: { increment: points > 0 ? points : 0 } },
      }),
      this.prisma.loyaltyTransaction.create({
        data: { clientId, type: points > 0 ? 'EARN' : 'SPEND', points: Math.abs(points), balance: newBalance, description, referenceId, referenceType },
      }),
    ])
    return { loyalty: updated, transaction: tx }
  }

  async getTransactions(clientId: number) {
    return this.prisma.loyaltyTransaction.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }
}
