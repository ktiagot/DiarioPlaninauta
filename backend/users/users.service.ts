import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
    }

    const passwordHash = await argon2.hash(dto.senha);

    return this.prisma.user.create({
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
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuário com id "${id}" não encontrado.`);
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    return this.prisma.user.update({
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
  }
}
