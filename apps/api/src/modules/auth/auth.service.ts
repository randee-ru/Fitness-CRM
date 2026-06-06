import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const staff = await this.prisma.staff.findUnique({ where: { email: dto.email } })
    if (!staff || !staff.isActive) throw new UnauthorizedException('Неверный email или пароль')

    const valid = await bcrypt.compare(dto.password, staff.passwordHash)
    if (!valid) throw new UnauthorizedException('Неверный email или пароль')

    const token = this.jwt.sign({ sub: staff.id, email: staff.email, role: staff.role })

    return {
      access_token: token,
      user: {
        id: staff.id,
        email: staff.email,
        role: staff.role,
        firstName: staff.firstName,
        lastName: staff.lastName,
        avatar: staff.avatar,
      },
    }
  }

  async me(staffId: number) {
    return this.prisma.staff.findUnique({
      where: { id: staffId },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, avatar: true },
    })
  }
}
