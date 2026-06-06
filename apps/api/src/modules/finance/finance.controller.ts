import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { RolesGuard } from '../../common/guards/roles.guard'
import { FinanceService } from './finance.service'

@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('stats')
  @Roles('ADMIN', 'DIRECTOR', 'MANAGER')
  @ApiOperation({ summary: 'Финансовая сводка' })
  getStats() { return this.financeService.getDashboardStats() }

  @Get('payments')
  @Roles('ADMIN', 'DIRECTOR', 'MANAGER', 'RECEPTION')
  @ApiOperation({ summary: 'Платежи' })
  getPayments(@Query() query: any) { return this.financeService.getPayments(query) }

  @Post('payments')
  @Roles('ADMIN', 'MANAGER', 'RECEPTION')
  @ApiOperation({ summary: 'Создать платёж' })
  createPayment(@Body() body: any) { return this.financeService.createPayment(body) }

  @Get('cash')
  @Roles('ADMIN', 'DIRECTOR', 'MANAGER')
  @ApiOperation({ summary: 'Кассовые операции' })
  getCash(@Query() query: any) { return this.financeService.getCashOperations(query) }

  @Post('cash')
  @Roles('ADMIN', 'MANAGER', 'RECEPTION')
  @ApiOperation({ summary: 'Кассовая операция' })
  createCash(@Body() body: any) { return this.financeService.createCashOperation(body) }

  @Get('invoices')
  @Roles('ADMIN', 'DIRECTOR', 'MANAGER')
  @ApiOperation({ summary: 'Счета' })
  getInvoices(@Query() query: any) { return this.financeService.getInvoices(query) }
}
