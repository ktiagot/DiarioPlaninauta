import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { CreditarPontosDto } from './dto/creditar-pontos.dto';
import { ResgatarDto } from './dto/resgatar.dto';
import { ProdutoResponseDto } from './dto/produto-response.dto';
import { PontoResponseDto } from './dto/ponto-response.dto';
import { SaldoResponseDto } from './dto/saldo-response.dto';

@Injectable()
export class LojaService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── PRODUTOS ─────────────────────────────────────────────

  async listarProdutosAtivos(): Promise<ProdutoResponseDto[]> {
    const produtos = await this.prisma.produto.findMany({
      where: { ativo: true },
      orderBy: { precoPontos: 'asc' },
    });
    return produtos.map(this.toProdutoResponse);
  }

  async criarProduto(dto: CreateProdutoDto): Promise<ProdutoResponseDto> {
    const produto = await this.prisma.produto.create({
      data: {
        nome: dto.nome,
        descricao: dto.descricao ?? null,
        precoPontos: dto.precoPontos,
        imagemUrl: dto.imagemUrl ?? null,
        estoque: dto.estoque ?? null,
      },
    });
    return this.toProdutoResponse(produto);
  }

  async editarProduto(id: string, dto: UpdateProdutoDto): Promise<ProdutoResponseDto> {
    const exists = await this.prisma.produto.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Produto "${id}" não encontrado.`);
    }

    const produto = await this.prisma.produto.update({
      where: { id },
      data: {
        ...(dto.nome !== undefined && { nome: dto.nome }),
        ...(dto.descricao !== undefined && { descricao: dto.descricao }),
        ...(dto.precoPontos !== undefined && { precoPontos: dto.precoPontos }),
        ...(dto.imagemUrl !== undefined && { imagemUrl: dto.imagemUrl }),
        ...(dto.estoque !== undefined && { estoque: dto.estoque }),
        ...(dto.ativo !== undefined && { ativo: dto.ativo }),
      },
    });
    return this.toProdutoResponse(produto);
  }

  async desativarProduto(id: string): Promise<ProdutoResponseDto> {
    const exists = await this.prisma.produto.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Produto "${id}" não encontrado.`);
    }

    const produto = await this.prisma.produto.update({
      where: { id },
      data: { ativo: false },
    });
    return this.toProdutoResponse(produto);
  }

  // ─── PONTOS ───────────────────────────────────────────────

  async obterSaldo(userId: string): Promise<SaldoResponseDto> {
    const saldo = await this.calcularSaldo(userId);
    return { saldo };
  }

  async obterHistorico(userId: string): Promise<PontoResponseDto[]> {
    const pontos = await this.prisma.ponto.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return pontos.map(this.toPontoResponse);
  }

  async creditarPontos(dto: CreditarPontosDto): Promise<PontoResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException(`Usuário "${dto.userId}" não encontrado.`);
    }

    const ponto = await this.prisma.ponto.create({
      data: {
        userId: dto.userId,
        tipo: 'credito',
        quantidade: dto.quantidade,
        descricao: dto.descricao,
        referenciaTipo: dto.referenciaTipo ?? null,
        referenciaId: dto.referenciaId ?? null,
      },
    });
    return this.toPontoResponse(ponto);
  }

  // ─── RESGATE ──────────────────────────────────────────────

  async resgatar(userId: string, dto: ResgatarDto): Promise<PontoResponseDto> {
    const produto = await this.prisma.produto.findUnique({
      where: { id: dto.produtoId },
    });

    if (!produto || !produto.ativo) {
      throw new NotFoundException('Produto não encontrado ou inativo.');
    }

    const saldo = await this.calcularSaldo(userId);

    if (saldo < produto.precoPontos) {
      throw new BadRequestException(
        `Saldo insuficiente. Você tem ${saldo} pontos, mas o produto custa ${produto.precoPontos}.`,
      );
    }

    if (produto.estoque !== null && produto.estoque <= 0) {
      throw new BadRequestException('Produto sem estoque disponível.');
    }

    // Transação: cria resgate + debita pontos + decrementa estoque
    const [ponto] = await this.prisma.$transaction(async (tx) => {
      // Criar o resgate
      await tx.resgate.create({
        data: {
          userId,
          produtoId: produto.id,
          pontosGastos: produto.precoPontos,
          status: 'pendente',
        },
      });

      // Debitar pontos
      const pontoDebito = await tx.ponto.create({
        data: {
          userId,
          tipo: 'debito',
          quantidade: produto.precoPontos,
          descricao: `Resgate: ${produto.nome}`,
          referenciaTipo: 'loja',
          referenciaId: produto.id,
        },
      });

      // Decrementar estoque se aplicável
      if (produto.estoque !== null) {
        await tx.produto.update({
          where: { id: produto.id },
          data: { estoque: { decrement: 1 } },
        });
      }

      return [pontoDebito];
    });

    return this.toPontoResponse(ponto);
  }

  // ─── HELPERS ──────────────────────────────────────────────

  private async calcularSaldo(userId: string): Promise<number> {
    const pontos = await this.prisma.ponto.findMany({
      where: { userId },
      select: { tipo: true, quantidade: true },
    });

    return pontos.reduce((acc, p) => {
      return p.tipo === 'credito' ? acc + p.quantidade : acc - p.quantidade;
    }, 0);
  }

  private toProdutoResponse(produto: {
    id: string;
    nome: string;
    descricao: string | null;
    precoPontos: number;
    imagemUrl: string | null;
    estoque: number | null;
    ativo: boolean;
    createdAt: Date;
  }): ProdutoResponseDto {
    return {
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      precoPontos: produto.precoPontos,
      imagemUrl: produto.imagemUrl,
      estoque: produto.estoque,
      ativo: produto.ativo,
      createdAt: produto.createdAt,
    };
  }

  private toPontoResponse(ponto: {
    id: string;
    tipo: string;
    quantidade: number;
    descricao: string;
    referenciaTipo: string | null;
    referenciaId: string | null;
    createdAt: Date;
  }): PontoResponseDto {
    return {
      id: ponto.id,
      tipo: ponto.tipo,
      quantidade: ponto.quantidade,
      descricao: ponto.descricao,
      referenciaTipo: ponto.referenciaTipo,
      referenciaId: ponto.referenciaId,
      createdAt: ponto.createdAt,
    };
  }
}
