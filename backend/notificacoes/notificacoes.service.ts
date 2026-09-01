import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificacaoDto } from './dto/create-notificacao.dto';
import { NotificacaoResponseDto } from './dto/notificacao-response.dto';
import { ContadorNaoLidasDto } from './dto/contador-nao-lidas.dto';

@Injectable()
export class NotificacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(userId: string): Promise<NotificacaoResponseDto[]> {
    const notificacoes = await this.prisma.notificacao.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return notificacoes.map(this.toResponse);
  }

  async contarNaoLidas(userId: string): Promise<ContadorNaoLidasDto> {
    const count = await this.prisma.notificacao.count({
      where: { userId, lida: false },
    });
    return { count };
  }

  async marcarComoLida(id: string, userId: string): Promise<NotificacaoResponseDto> {
    const notificacao = await this.prisma.notificacao.findFirst({
      where: { id, userId },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada.');
    }

    const updated = await this.prisma.notificacao.update({
      where: { id },
      data: { lida: true },
    });

    return this.toResponse(updated);
  }

  async marcarTodasComoLidas(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notificacao.updateMany({
      where: { userId, lida: false },
      data: { lida: true },
    });
    return { count: result.count };
  }

  async criar(dto: CreateNotificacaoDto): Promise<NotificacaoResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`Usuário "${dto.userId}" não encontrado.`);
    }

    const notificacao = await this.prisma.notificacao.create({
      data: {
        userId: dto.userId,
        tipo: dto.tipo,
        titulo: dto.titulo,
        mensagem: dto.mensagem,
      },
    });

    return this.toResponse(notificacao);
  }

  private toResponse(notificacao: {
    id: string;
    tipo: string;
    titulo: string;
    mensagem: string;
    lida: boolean;
    referenciaTipo: string | null;
    referenciaId: string | null;
    createdAt: Date;
  }): NotificacaoResponseDto {
    return {
      id: notificacao.id,
      tipo: notificacao.tipo,
      titulo: notificacao.titulo,
      mensagem: notificacao.mensagem,
      lida: notificacao.lida,
      referenciaTipo: notificacao.referenciaTipo,
      referenciaId: notificacao.referenciaId,
      createdAt: notificacao.createdAt,
    };
  }
}
