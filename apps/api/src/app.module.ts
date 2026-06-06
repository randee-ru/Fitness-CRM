import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { ClientsModule } from './modules/clients/clients.module'
import { CrmModule } from './modules/crm/crm.module'
import { VisitsModule } from './modules/visits/visits.module'
import { RfidModule } from './modules/rfid/rfid.module'
import { LoyaltyModule } from './modules/loyalty/loyalty.module'
import { ScheduleModule } from './modules/schedule/schedule.module'
import { FinanceModule } from './modules/finance/finance.module'
import { MangoModule } from './modules/mango/mango.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        level: process.env.LOG_LEVEL || 'info',
      },
    }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),

    PrismaModule,
    AuthModule,
    ClientsModule,
    CrmModule,
    VisitsModule,
    RfidModule,
    LoyaltyModule,
    ScheduleModule,
    FinanceModule,
    MangoModule,
  ],
})
export class AppModule {}
