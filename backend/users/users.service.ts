import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { ApoiaSeService } from '../apoiase/apoiase.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';
import { toUserResponse } from './mappers/to-user-response';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apoiaseService: ApoiaSeService,
  ) {}

  async checkAvailability(
    email?: string,
    nick?: string,
  ): Promise<AvailabilityResponseDto> {
    const normalizedEmail = email?.trim() || undefined;
    const normalizedNick = nick?.trim() || undefined;

    let emailTaken: boolean | null = null;
    let nickTaken: boolean | null = null;

    if (normalizedEmail) {
      const existing = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });
      emailTaken = !!existing;
    }

    if (normalizedNick) {
      const existing = await this.prisma.user.findUnique({
        where: { nick: normalizedNick },
        select: { id: true },
      });
      nickTaken = !!existing;
    }

    return { emailTaken, nickTaken };
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingByEmail) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
    }

    const existingByNick = await this.prisma.user.findUnique({
      where: { nick: dto.nick },
    });

    if (existingByNick) {
      throw new ConflictException('Já existe um usuário cadastrado com este nick.');
    }

    const backer = await this.apoiaseService.verify(dto.email);
    const passwordHash = await argon2.hash(dto.senha);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          nome: dto.nome,
          sobrenome: dto.sobrenome,
          nick: dto.nick,
          telefone: dto.telefone,
          formatos: dto.formatos ?? [],
          cidade: dto.cidade,
          foto: dto.foto,
          genero: dto.genero,
          tier: dto.tier,
          badge: dto.badge,
          formatoFavorito: dto.formatoFavorito,
          diasDisponiveis: dto.diasDisponiveis ?? [],
          horarios: dto.horarios ?? [],
          decksMaisUsados: dto.decksMaisUsados ?? [],
          preCampeonatos: dto.preCampeonatos ?? [],
          melhoresResultados: [],
          isApoiadorAtivo: backer.isBacker,
          monthlyContribution: backer.thisMonthPaidValue ?? null,
          lastValidationAt: new Date(),
        },
      });

      return toUserResponse(user);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const target = err.meta?.target;
        const fields = Array.isArray(target) ? target : [target];
        if (fields.includes('nick')) {
          throw new ConflictException('Já existe um usuário cadastrado com este nick.');
        }
        throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
      }
      throw err;
    }
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuário com id "${id}" não encontrado.`);
    }

    return toUserResponse(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        nome: dto.nome,
        sobrenome: dto.sobrenome,
        nick: dto.nick,
        telefone: dto.telefone,
        formatos: dto.formatos,
        cidade: dto.cidade,
        foto: dto.foto,
        genero: dto.genero,
        tier: dto.tier,
        badge: dto.badge,
        formatoFavorito: dto.formatoFavorito,
        diasDisponiveis: dto.diasDisponiveis,
        horarios: dto.horarios,
        partidas: dto.partidas,
        vitorias: dto.vitorias,
        eliminacoes: dto.eliminacoes,
        winRate: dto.winRate,
        pontosTotais: dto.pontosTotais,
        melhoresResultados: dto.melhoresResultados,
        preCampeonatos: dto.preCampeonatos,
        decksMaisUsados: dto.decksMaisUsados,
      },
    });

    return toUserResponse(user);
  }
}
