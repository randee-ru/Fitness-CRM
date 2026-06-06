import { Controller, Get, Post, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { LoyaltyService } from './loyalty.service'

@ApiTags('loyalty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('programs')
  @ApiOperation({ summary: 'Программы лояльности' })
  getPrograms() { return this.loyaltyService.getPrograms() }

  @Get('clients/:clientId')
  @ApiOperation({ summary: 'Аккаунт лояльности клиента' })
  getClientLoyalty(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.loyaltyService.getClientLoyalty(clientId)
  }

  @Get('clients/:clientId/transactions')
  @ApiOperation({ summary: 'История баллов клиента' })
  getTransactions(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.loyaltyService.getTransactions(clientId)
  }

  @Post('clients/:clientId/points')
  @ApiOperation({ summary: 'Начислить / списать баллы' })
  addPoints(@Param('clientId', ParseIntPipe) clientId: number, @Body() body: { points: number; description?: string }) {
    return this.loyaltyService.addPoints(clientId, body.points, body.description)
  }
}
