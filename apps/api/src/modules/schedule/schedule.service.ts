import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async getClasses(query: { from?: string; to?: string; trainerId?: number }) {
    const where: any = {}
    if (query.from || query.to) {
      where.startTime = {}
      if (query.from) where.startTime.gte = new Date(query.from)
      if (query.to) where.startTime.lte = new Date(query.to)
    }
    if (query.trainerId) where.trainerId = query.trainerId

    return this.prisma.class.findMany({
      where,
      include: {
        classType: true,
        trainer: true,
        _count: { select: { registrations: { where: { status: 'registered' } } } },
      },
      orderBy: { startTime: 'asc' },
    })
  }

  async createClass(data: any) {
    return this.prisma.class.create({
      data: {
        ...data,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      },
      include: { classType: true, trainer: true },
    })
  }

  async updateClass(id: number, data: any) {
    return this.prisma.class.update({ where: { id }, data })
  }

  async cancelClass(id: number) {
    return this.prisma.class.update({ where: { id }, data: { status: 'cancelled' } })
  }

  async register(classId: number, clientId: number) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { _count: { select: { registrations: { where: { status: 'registered' } } } } },
    })
    if (!cls) throw new NotFoundException('Занятие не найдено')
    if (cls.status === 'cancelled') throw new BadRequestException('Занятие отменено')

    const existing = await this.prisma.classRegistration.findUnique({ where: { classId_clientId: { classId, clientId } } })
    if (existing && existing.status !== 'cancelled') throw new BadRequestException('Уже записан')

    const status = cls._count.registrations >= cls.maxCapacity ? 'waitlist' : 'registered'

    return this.prisma.classRegistration.upsert({
      where: { classId_clientId: { classId, clientId } },
      create: { classId, clientId, status },
      update: { status, cancelledAt: null },
    })
  }

  async cancelRegistration(classId: number, clientId: number) {
    return this.prisma.classRegistration.update({
      where: { classId_clientId: { classId, clientId } },
      data: { status: 'cancelled', cancelledAt: new Date() },
    })
  }

  async getTrainers() {
    return this.prisma.trainer.findMany({ where: { isActive: true }, orderBy: { firstName: 'asc' } })
  }

  async getClassTypes() {
    return this.prisma.classType.findMany({ where: { isActive: true } })
  }
}
