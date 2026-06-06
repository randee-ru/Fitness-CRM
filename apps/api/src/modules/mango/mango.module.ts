import { Module } from '@nestjs/common'
import { MangoService } from './mango.service'
import { MangoController } from './mango.controller'

@Module({ controllers: [MangoController], providers: [MangoService] })
export class MangoModule {}
