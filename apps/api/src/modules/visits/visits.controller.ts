import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { VisitsService } from './visits.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('visits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get('in-club')
  @ApiOperation({ summary: 'Клиенты в клубе сейчас' })
  getClientsInClub() { return this.visitsService.getClientsInClub() }

  @Get('search')
  @ApiOperation({ summary: 'Поиск клиента для чекина' })
  search(@Query('q') q: string) { return this.visitsService.searchForCheckIn(q) }

  @Get()
  @ApiOperation({ summary: 'История посещений' })
  getHistory(@Query() query: any) { return this.visitsService.getHistory(query) }

  @Post('check-in')
  @ApiOperation({ summary: 'Отметить вход' })
  checkIn(@Body() body: { clientId: number }, @CurrentUser() user: any) {
    return this.visitsService.checkIn(body.clientId, user.id)
  }

  @Put(':id/check-out')
  @ApiOperation({ summary: 'Отметить выход' })
  checkOut(@Param('id', ParseIntPipe) id: number) {
    return this.visitsService.checkOut(id)
  }
}
