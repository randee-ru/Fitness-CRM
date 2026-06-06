import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  async getPipelines() {
    return this.prisma.pipeline.findMany({
      where: { isActive: true },
      include: {
        stages: {
          orderBy: { sortOrder: 'asc' },
          include: {
            deals: {
              where: { status: 'OPEN' },
              include: {
                client: { select: { id: true, firstName: true, lastName: true, phone: true, photoUrl: true } },
                assignedTo: { select: { id: true, firstName: true, lastName: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async getPipeline(id: number) {
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    })
    if (!pipeline) throw new NotFoundException(`Pipeline #${id} не найден`)
    return pipeline
  }

  async createPipeline(data: { name: string; description?: string }) {
    return this.prisma.pipeline.create({ data, include: { stages: true } })
  }

  async getDeals(query: { pipelineId?: number; stageId?: number; assignedToId?: number; status?: string }) {
    const where: any = {}
    if (query.pipelineId) where.pipelineId = query.pipelineId
    if (query.stageId) where.stageId = query.stageId
    if (query.assignedToId) where.assignedToId = query.assignedToId
    if (query.status) where.status = query.status

    return this.prisma.deal.findMany({
      where,
      include: {
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
        stage: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getDeal(id: number) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        client: true,
        stage: true,
        pipeline: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        comments: {
          include: { staff: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        tasks: {
          include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { dueDate: 'asc' },
        },
        activities: {
          include: { staff: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!deal) throw new NotFoundException(`Сделка #${id} не найдена`)
    return deal
  }

  async createDeal(data: any) {
    return this.prisma.deal.create({
      data,
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        stage: true,
      },
    })
  }

  async updateDeal(id: number, data: any) {
    await this.getDeal(id)
    return this.prisma.deal.update({ where: { id }, data })
  }

  async moveDeal(id: number, stageId: number) {
    const deal = await this.getDeal(id)
    const stage = await this.prisma.pipeline_Stage.findUnique({ where: { id: stageId } })
    if (!stage) throw new NotFoundException(`Стадия #${stageId} не найдена`)

    const updated = await this.prisma.deal.update({ where: { id }, data: { stageId } })

    await this.prisma.dealActivity.create({
      data: {
        dealId: id,
        type: 'stage_change',
        data: { from: deal.stageId, to: stageId, fromName: deal.stage.name, toName: stage.name },
      },
    })

    return updated
  }

  async addComment(dealId: number, staffId: number, text: string) {
    const comment = await this.prisma.dealComment.create({
      data: { dealId, staffId, text },
      include: { staff: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    })

    await this.prisma.dealActivity.create({
      data: { dealId, staffId, type: 'comment', data: { text } },
    })

    return comment
  }

  async createTask(dealId: number, data: any) {
    return this.prisma.dealTask.create({
      data: { dealId, ...data },
      include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
    })
  }

  async completeTask(id: number) {
    return this.prisma.dealTask.update({
      where: { id },
      data: { completedAt: new Date() },
    })
  }
}
