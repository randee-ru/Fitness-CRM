import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RfidService } from './rfid.service'

@ApiTags('rfid')
@Controller('rfid')
export class RfidController {
  constructor(private readonly rfidService: RfidService) {}

  @Post('access')
  @ApiOperation({ summary: 'Проверить доступ по RFID (турникет)' })
  processAccess(@Body() body: { code: string; zone: string; deviceId?: string }) {
    return this.rfidService.processAccess(body.code, body.zone, body.deviceId)
  }

  @Get('events')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'События доступа' })
  getEvents(@Query() query: any) { return this.rfidService.getAccessEvents(query) }

  @Get('clients/:clientId/keys')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'RFID ключи клиента' })
  getClientKeys(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.rfidService.getClientKeys(clientId)
  }

  @Post('clients/:clientId/keys')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Выдать RFID ключ / браслет' })
  issueKey(@Param('clientId', ParseIntPipe) clientId: number, @Body() body: { code: string; type: string; label?: string }) {
    return this.rfidService.issueKey(clientId, body)
  }

  @Put('keys/:id/revoke')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Заблокировать ключ' })
  revokeKey(@Param('id', ParseIntPipe) id: number) {
    return this.rfidService.revokeKey(id)
  }
}
