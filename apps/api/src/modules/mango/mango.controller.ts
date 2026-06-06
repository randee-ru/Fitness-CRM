import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { MangoService } from './mango.service'

@ApiTags('mango')
@Controller('mango')
export class MangoController {
  constructor(private readonly mangoService: MangoService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Вебхук от Mango Office' })
  webhook(@Body() body: any) { return this.mangoService.handleWebhook(body) }

  @Get('calls')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'История звонков' })
  getCalls(@Query() query: any) { return this.mangoService.getCalls(query) }
}
