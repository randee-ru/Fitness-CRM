import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'sportmax-secret',
    })
  }

  async validate(payload: { sub: number; email: string; role: string }) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, isActive: true },
    })
    if (!staff || !staff.isActive) throw new UnauthorizedException()
    return staff
  }
}
