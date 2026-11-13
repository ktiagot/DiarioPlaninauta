import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthUser } from '../auth/strategies/jwt.strategy';
import { GestaoService } from './gestao.service';
import { RodadaAtualDto } from './dto/rodada-atual.dto';
import {
  AjustePontosDto,
  AjustePontosResponseDto,
  ColocarJogadorMesaDto,
  UpdateInscricaoAdminDto,
  UpdateRodadaDto,
} from './dto/gestao.dto';

@ApiTags('Precompeonato — Gestão manual (admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('precompeonato')
export class GestaoController {
  constructor(private readonly gestao: GestaoService) {}

  // ---- Ranking ----

  @Post('atual/ranking/recalcular')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Recalcular ranking do campeonato atual',
    description:
      'Reaplica pontos e critérios de desempate (pontos, eliminações, força dos adversários) sem alterar resultados.',
  })
  async recalcularRanking(): Promise<void> {
    await this.gestao.recalcularRanking();
  }

  // ---- Rodadas ----

  @Patch('rodadas/:rodadaId')
  @ApiOperation({ summary: 'Editar número/data da rodada' })
  @ApiOkResponse({ type: RodadaAtualDto })
  @ApiConflictResponse()
  atualizarRodada(
    @Param('rodadaId') rodadaId: string,
    @Body() dto: UpdateRodadaDto,
  ): Promise<RodadaAtualDto> {
    return this.gestao.atualizarRodada(rodadaId, dto);
  }

  @Post('rodadas/:rodadaId/reabrir')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reabrir rodada finalizada',
    description: 'Desfaz a finalização e recalcula pontos/classificação.',
  })
  @ApiOkResponse({ type: RodadaAtualDto })
  @ApiConflictResponse()
  reabrirRodada(@Param('rodadaId') rodadaId: string): Promise<RodadaAtualDto> {
    return this.gestao.reabrirRodada(rodadaId);
  }

  @Delete('rodadas/:rodadaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir rodada não finalizada (apaga mesas e check-ins)' })
  @ApiConflictResponse()
  async excluirRodada(@Param('rodadaId') rodadaId: string): Promise<void> {
    await this.gestao.excluirRodada(rodadaId);
  }

  // ---- Mesas ----

  @Post('rodadas/:rodadaId/mesas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Criar mesa vazia na rodada' })
  @ApiOkResponse({ type: RodadaAtualDto })
  criarMesa(@Param('rodadaId') rodadaId: string): Promise<RodadaAtualDto> {
    return this.gestao.criarMesa(rodadaId);
  }

  @Delete('mesas/:mesaId')
  @ApiOperation({ summary: 'Excluir mesa da rodada' })
  @ApiOkResponse({ type: RodadaAtualDto })
  excluirMesa(@Param('mesaId') mesaId: string): Promise<RodadaAtualDto> {
    return this.gestao.excluirMesa(mesaId);
  }

  @Post('mesas/:mesaId/jogadores')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Colocar jogador na mesa (move se já estiver em outra mesa da rodada)',
  })
  @ApiOkResponse({ type: RodadaAtualDto })
  @ApiNotFoundResponse()
  colocarJogador(
    @Param('mesaId') mesaId: string,
    @Body() dto: ColocarJogadorMesaDto,
  ): Promise<RodadaAtualDto> {
    return this.gestao.colocarJogador(mesaId, dto);
  }

  @Delete('mesas/:mesaId/jogadores/:inscricaoId')
  @ApiOperation({ summary: 'Remover jogador da mesa' })
  @ApiOkResponse({ type: RodadaAtualDto })
  removerJogador(
    @Param('mesaId') mesaId: string,
    @Param('inscricaoId') inscricaoId: string,
  ): Promise<RodadaAtualDto> {
    return this.gestao.removerJogador(mesaId, inscricaoId);
  }

  @Post('mesas/:mesaId/invalidar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidar mesa (mantém o resultado, volta a pendente)' })
  @ApiOkResponse({ type: RodadaAtualDto })
  invalidarMesa(@Param('mesaId') mesaId: string): Promise<RodadaAtualDto> {
    return this.gestao.invalidarMesa(mesaId);
  }

  @Post('mesas/:mesaId/limpar-resultado')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Limpar resultado da mesa (recalcula ranking se rodada finalizada)' })
  @ApiOkResponse({ type: RodadaAtualDto })
  limparResultado(@Param('mesaId') mesaId: string): Promise<RodadaAtualDto> {
    return this.gestao.limparResultado(mesaId);
  }

  // ---- Inscrições ----

  @Post('inscricoes/:id/ajustes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ajustar pontos manualmente (com motivo, auditado)' })
  @ApiOkResponse({ type: AjustePontosResponseDto })
  ajustarPontos(
    @Param('id') id: string,
    @Body() dto: AjustePontosDto,
    @Req() req: { user: AuthUser },
  ): Promise<AjustePontosResponseDto> {
    return this.gestao.ajustarPontos(id, dto, req.user.id);
  }

  @Get('inscricoes/:id/ajustes')
  @ApiOperation({ summary: 'Histórico de ajustes de pontos da inscrição' })
  @ApiOkResponse({ type: [AjustePontosResponseDto] })
  listarAjustes(@Param('id') id: string): Promise<AjustePontosResponseDto[]> {
    return this.gestao.listarAjustes(id);
  }

  @Patch('inscricoes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Editar inscrição (grupo, deck, comandante, discord)' })
  async atualizarInscricao(
    @Param('id') id: string,
    @Body() dto: UpdateInscricaoAdminDto,
  ): Promise<void> {
    await this.gestao.atualizarInscricao(id, dto);
  }

  @Delete('inscricoes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover inscrição (só se nunca participou de mesas)',
  })
  @ApiConflictResponse()
  async removerInscricao(@Param('id') id: string): Promise<void> {
    await this.gestao.removerInscricao(id);
  }
}
