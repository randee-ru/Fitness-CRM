import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getPayments(query: { page?: number; limit?: number; clientId?: number; from?: string; to?: string }) {
    const { page = 1, limit = 20, clientId, from, to } = query
    const where: any = {}
    if (clientId) where.clientId = clientId
    if (from || to) {
      where.paidAt = {}
      if (from) where.paidAt.gte = new Date(from)
      if (to) where.paidAt.lte = new Date(to)
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        include: { client: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { paidAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      this.prisma.payment.count({ where }),
    ])

    return { data, pagination: { page: Number(page), limit: Number(limit), total } }
  }

  async createPayment(data: any) {
    return this.prisma.payment.create({
      data,
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
    })
  }

  async getCashOperations(query: { from?: string; to?: string }) {
    const where: any = {}
    if (query.from || query.to) {
      where.date = {}
      if (query.from) where.date.gte = new Date(query.from)
      if (query.to) where.date.lte = new Date(query.to)
    }
    return this.prisma.cashOperation.findMany({ where, orderBy: { date: 'desc' } })
  }

  async createCashOperation(data: any) {
    return this.prisma.cashOperation.create({ data })
  }

  async getDashboardStats() {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [todayPayments, monthPayments, cashIn, cashOut] = await this.prisma.$transaction([
      this.prisma.payment.aggregate({ where: { paidAt: { gte: startOfToday }, status: 'COMPLETED' }, _sum: { amount: true }, _count: true }),
      this.prisma.payment.aggregate({ where: { paidAt: { gte: startOfMonth }, status: 'COMPLETED' }, _sum: { amount: true }, _count: true }),
      this.prisma.cashOperation.aggregate({ where: { date: { gte: startOfMonth }, type: 'income' }, _sum: { amount: true } }),
      this.prisma.cashOperation.aggregate({ where: { date: { gte: startOfMonth }, type: 'expense' }, _sum: { amount: true } }),
    ])

    return {
      today: { total: todayPayments._sum.amount || 0, count: todayPayments._count },
      month: { total: monthPayments._sum.amount || 0, count: monthPayments._count },
      cashBalance: Number(cashIn._sum.amount || 0) - Number(cashOut._sum.amount || 0),
    }
  }

  async getInvoices(query: { clientId?: number; status?: string }) {
    const where: any = {}
    if (query.clientId) where.clientId = query.clientId
    if (query.status) where.status = query.status
    return this.prisma.invoice.findMany({ where, orderBy: { createdAt: 'desc' } })
  }
}
