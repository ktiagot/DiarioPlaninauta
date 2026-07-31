import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { LojaService } from './loja.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { CreditarPontosDto } from './dto/creditar-pontos.dto';
import { ResgatarDto } from './dto/resgatar.dto';
import { ProdutoResponseDto } from './dto/produto-response.dto';
import { PontoResponseDto } from './dto/ponto-response.dto';
import { SaldoResponseDto } from './dto/saldo-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Loja')
@Controller('loja')
export class LojaController {
  constructor(private readonly lojaService: LojaService) {}

  // ─── PRODUTOS ─────────────────────────────────────────────

  @Get('produtos')
  @ApiOperation({ summary: 'Listar produtos ativos', description: 'Endpoint público.' })
  @ApiOkResponse({ description: 'Lista de produtos ativos.', type: [ProdutoResponseDto] })
  listarProdutos(): Promise<ProdutoResponseDto[]> {
    return this.lojaService.listarProdutosAtivos();
  }

  @Post('produtos')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar produto (admin)' })
  @ApiCreatedResponse({ description: 'Produto criado.', type: ProdutoResponseDto })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  criarProduto(@Body() dto: CreateProdutoDto): Promise<ProdutoResponseDto> {
    return this.lojaService.criarProduto(dto);
  }

  @Patch('produtos/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Editar produto (admin)' })
  @ApiOkResponse({ description: 'Produto atualizado.', type: ProdutoResponseDto })
  @ApiNotFoundResponse({ description: 'Produto não encontrado.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  editarProduto(
    @Param('id') id: string,
    @Body() dto: UpdateProdutoDto,
  ): Promise<ProdutoResponseDto> {
    return this.lojaService.editarProduto(id, dto);
  }

  @Delete('produtos/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Desativar produto (admin)', description: 'Soft delete — marca como inativo.' })
  @ApiOkResponse({ description: 'Produto desativado.', type: ProdutoResponseDto })
  @ApiNotFoundResponse({ description: 'Produto não encontrado.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  desativarProduto(@Param('id') id: string): Promise<ProdutoResponseDto> {
    return this.lojaService.desativarProduto(id);
  }

  // ─── PONTOS ───────────────────────────────────────────────

  @Get('pontos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Saldo de pontos do usuário logado' })
  @ApiOkResponse({ description: 'Saldo atual.', type: SaldoResponseDto })
  obterSaldo(@Request() req: { user: AuthUser }): Promise<SaldoResponseDto> {
    return this.lojaService.obterSaldo(req.user.id);
  }

  @Get('pontos/historico')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Histórico de transações de pontos do usuário logado' })
  @ApiOkResponse({ description: 'Lista de transações.', type: [PontoResponseDto] })
  obterHistorico(@Request() req: { user: AuthUser }): Promise<PontoResponseDto[]> {
    return this.lojaService.obterHistorico(req.user.id);
  }

  @Post('pontos/creditar')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creditar pontos a um usuário (admin)' })
  @ApiCreatedResponse({ description: 'Pontos creditados.', type: PontoResponseDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  creditarPontos(@Body() dto: CreditarPontosDto): Promise<PontoResponseDto> {
    return this.lojaService.creditarPontos(dto);
  }

  // ─── RESGATE ──────────────────────────────────────────────

  @Post('resgatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Resgatar produto', description: 'Debita pontos e registra o pedido de resgate.' })
  @ApiCreatedResponse({ description: 'Resgate realizado.', type: PontoResponseDto })
  @ApiNotFoundResponse({ description: 'Produto não encontrado ou inativo.' })
  @ApiBadRequestResponse({ description: 'Saldo insuficiente ou sem estoque.' })
  resgatar(
    @Request() req: { user: AuthUser },
    @Body() dto: ResgatarDto,
  ): Promise<PontoResponseDto> {
    return this.lojaService.resgatar(req.user.id, dto);
  }
}
