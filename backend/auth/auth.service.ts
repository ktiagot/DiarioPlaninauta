import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApoiaSeService } from '../apoiase/apoiase.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly apoiaseService: ApoiaSeService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async verifyBacker(email: string) {
    const backer = await this.apoiaseService.verify(email);
    return {
      isBacker: backer.isBacker,
      isPaidThisMonth: backer.isPaidThisMonth,
    };
  }

  async requestLogin(email: string) {
    const backer = await this.apoiaseService.verify(email);

    if (!backer.isBacker) {
      throw new UnauthorizedException(
        'Você precisa ser apoiador ativo no APOIA.se para acessar o portal.',
      );
    }

    if (!backer.isPaidThisMonth) {
      throw new UnauthorizedException(
        'Seu apoio deste mês ainda não foi processado. Tente novamente em breve.',
      );
    }

    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          monthlyContribution: backer.thisMonthPaidValue ?? null,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { email },
        data: { monthlyContribution: backer.thisMonthPaidValue ?? null },
      });
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken, user };
  }
}
