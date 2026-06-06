import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CrmService } from './crm.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('crm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('pipelines')
  @ApiOperation({ summary: 'Все воронки с этапами и сделками' })
  getPipelines() { return this.crmService.getPipelines() }

  @Post('pipelines')
  @ApiOperation({ summary: 'Создать воронку' })
  createPipeline(@Body() body: { name: string; description?: string }) {
    return this.crmService.createPipeline(body)
  }

  @Get('deals')
  @ApiOperation({ summary: 'Список сделок' })
  getDeals(@Query() query: any) { return this.crmService.getDeals(query) }

  @Get('deals/:id')
  @ApiOperation({ summary: 'Детали сделки' })
  getDeal(@Param('id', ParseIntPipe) id: number) { return this.crmService.getDeal(id) }

  @Post('deals')
  @ApiOperation({ summary: 'Создать сделку' })
  createDeal(@Body() body: any, @CurrentUser() user: any) {
    return this.crmService.createDeal({ ...body, createdById: user.id })
  }

  @Put('deals/:id')
  @ApiOperation({ summary: 'Обновить сделку' })
  updateDeal(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.crmService.updateDeal(id, body)
  }

  @Put('deals/:id/move')
  @ApiOperation({ summary: 'Переместить сделку в другую стадию (Kanban)' })
  moveDeal(@Param('id', ParseIntPipe) id: number, @Body() body: { stageId: number }) {
    return this.crmService.moveDeal(id, body.stageId)
  }

  @Post('deals/:id/comments')
  @ApiOperation({ summary: 'Добавить комментарий к сделке' })
  addComment(@Param('id', ParseIntPipe) id: number, @Body() body: { text: string }, @CurrentUser() user: any) {
    return this.crmService.addComment(id, user.id, body.text)
  }

  @Post('deals/:id/tasks')
  @ApiOperation({ summary: 'Создать задачу по сделке' })
  createTask(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.crmService.createTask(id, body)
  }

  @Put('tasks/:id/complete')
  @ApiOperation({ summary: 'Завершить задачу' })
  completeTask(@Param('id', ParseIntPipe) id: number) {
    return this.crmService.completeTask(id)
  }
}
