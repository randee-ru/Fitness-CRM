import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ScheduleService } from './schedule.service'

@ApiTags('schedule')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('classes')
  @ApiOperation({ summary: 'Расписание занятий' })
  getClasses(@Query() query: any) { return this.scheduleService.getClasses(query) }

  @Post('classes')
  @ApiOperation({ summary: 'Создать занятие' })
  createClass(@Body() body: any) { return this.scheduleService.createClass(body) }

  @Put('classes/:id')
  @ApiOperation({ summary: 'Обновить занятие' })
  updateClass(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.scheduleService.updateClass(id, body) }

  @Delete('classes/:id')
  @ApiOperation({ summary: 'Отменить занятие' })
  cancelClass(@Param('id', ParseIntPipe) id: number) { return this.scheduleService.cancelClass(id) }

  @Post('classes/:id/register')
  @ApiOperation({ summary: 'Записать клиента на занятие' })
  register(@Param('id', ParseIntPipe) id: number, @Body() body: { clientId: number }) {
    return this.scheduleService.register(id, body.clientId)
  }

  @Delete('classes/:id/register/:clientId')
  @ApiOperation({ summary: 'Отменить запись клиента' })
  cancelRegistration(@Param('id', ParseIntPipe) id: number, @Param('clientId', ParseIntPipe) clientId: number) {
    return this.scheduleService.cancelRegistration(id, clientId)
  }

  @Get('trainers')
  @ApiOperation({ summary: 'Тренеры' })
  getTrainers() { return this.scheduleService.getTrainers() }

  @Get('class-types')
  @ApiOperation({ summary: 'Типы занятий' })
  getClassTypes() { return this.scheduleService.getClassTypes() }
}
