import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { ApoiaSeService } from '../apoiase/apoiase.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { toUserResponse } from './mappers/to-user-response';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apoiaseService: ApoiaSeService,
  ) {}

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
        isApoiadorAtivo: backer.isBacker,
        monthlyContribution: backer.thisMonthPaidValue ?? null,
        lastValidationAt: new Date(),
      },
    });

    return toUserResponse(user);
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
