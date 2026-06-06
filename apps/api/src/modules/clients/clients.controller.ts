import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ClientsService } from './clients.service'
import { CreateClientDto, UpdateClientDto, ClientQueryDto } from './dto/create-client.dto'

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Список клиентов' })
  findAll(@Query() query: ClientQueryDto) {
    return this.clientsService.findAll(query)
  }

  @Get('stats')
  @ApiOperation({ summary: 'Статистика по клиентам' })
  getStats() {
    return this.clientsService.getStats()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Карточка клиента' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id)
  }

  @Post()
  @ApiOperation({ summary: 'Создать клиента' })
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить клиента' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Деактивировать клиента' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.remove(id)
  }
}
