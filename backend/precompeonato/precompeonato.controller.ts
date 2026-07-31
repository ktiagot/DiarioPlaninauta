import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PrecompeonatoService } from './precompeonato.service';
import { SorteioService } from './sorteio/sorteio.service';
import { CreateInscricaoDto } from './dto/create-inscricao.dto';
import { CampeonatoAtualResponseDto } from './dto/campeonato-atual-response.dto';
import { InscricaoResponseDto } from './dto/inscricao-response.dto';
import { JogadorPrecompeonatoResponseDto } from './dto/jogador-precompeonato-response.dto';
import { EstatisticasFullResponseDto } from './dto/estatisticas-response.dto';
import { MinhasMesasResponseDto } from './dto/minhas-mesas-response.dto';
import { CheckInStatusDto, SorteioSnapshotDto } from './dto/sorteio.dto';
import { RodadaAtualDto } from './dto/rodada-atual.dto';
import { SubmitTorneioMesaResultadoDto } from './dto/submit-torneio-mesa-resultado.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Precompeonato')
@Controller('precompeonato')
export class PrecompeonatoController {
  constructor(
    private readonly precompeonatoService: PrecompeonatoService,
    private readonly sorteioService: SorteioService,
  ) {}

  @Get('atual')
  @ApiOperation({
    summary: 'Obter precompeonato atual',
    description:
      'Retorna o campeonato mais recente (por createdAt) com status legível. Query opcional email indica se o usuário já está inscrito.',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    example: 'usuario@email.com',
  })
  @ApiOkResponse({ description: 'Campeonato atual.', type: CampeonatoAtualResponseDto })
  @ApiNotFoundResponse({ description: 'Nenhum precompeonato encontrado.' })
  getAtual(@Query('email') email?: string): Promise<CampeonatoAtualResponseDto> {
    return this.precompeonatoService.getAtual(email);
  }

  @Get('atual/minhas-mesas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Minhas mesas no precompeonato atual',
    description:
      'Retorna todas as mesas do torneio em que o usuário autenticado participou no campeonato atual.',
  })
  @ApiOkResponse({
    description: 'Lista de mesas do jogador.',
    type: MinhasMesasResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Nenhum precompeonato encontrado.' })
  @ApiUnauthorizedResponse()
  getMinhasMesas(@Req() req: { user: AuthUser }): Promise<MinhasMesasResponseDto> {
    return this.precompeonatoService.getMinhasMesas(req.user.id);
  }

  @Post('inscricoes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Inscrever-se no precompeonato atual',
    description:
      'Cria inscrição quando o campeonato atual está com Inscrições abertas. O email deve pertencer a um usuário cadastrado.',
  })
  @ApiCreatedResponse({ description: 'Inscrição criada.', type: InscricaoResponseDto })
  @ApiBadRequestResponse({
    description: 'Aceites obrigatórios não confirmados ou payload inválido.',
  })
  @ApiNotFoundResponse({ description: 'Usuário ou campeonato não encontrado.' })
  @ApiConflictResponse({
    description: 'Inscrições fechadas ou usuário já inscrito.',
  })
  createInscricao(@Body() dto: CreateInscricaoDto): Promise<InscricaoResponseDto> {
    return this.precompeonatoService.createInscricao(dto);
  }

  @Get('atual/jogadores')
  @ApiOperation({
    summary: 'Listar jogadores do precompeonato atual',
    description:
      'Retorna inscritos ativos com deck, comandante, nome, posição, rodada/mesa atuais e pontos.',
  })
  @ApiOkResponse({
    description: 'Lista de jogadores.',
    type: [JogadorPrecompeonatoResponseDto],
  })
  @ApiNotFoundResponse({ description: 'Nenhum precompeonato encontrado.' })
  listJogadores(): Promise<JogadorPrecompeonatoResponseDto[]> {
    return this.precompeonatoService.listJogadores();
  }

  @Get('estatisticas')
  @ApiOperation({
    summary: 'Estatísticas do precompeonato atual',
    description:
      'Retorna estatísticas gerais (partidas, jogadores, rodadas, decks), metagame e top killers. Opcionalmente retorna estatísticas individuais quando userId é informado.',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'ID do usuário para retornar estatísticas individuais',
  })
  @ApiOkResponse({
    description: 'Estatísticas do campeonato.',
    type: EstatisticasFullResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Nenhum precompeonato encontrado.' })
  getEstatisticas(
    @Query('userId') userId?: string,
  ): Promise<EstatisticasFullResponseDto> {
    return this.precompeonatoService.getEstatisticas(userId);
  }

  @Get('atual/rodada')
  @ApiOperation({
    summary: 'Rodada atual com mesas do torneio',
    description:
      'Retorna a rodada ativa (ou a última com mesas) do precompeonato atual, com jogadores sorteados.',
  })
  @ApiOkResponse({ description: 'Rodada atual ou null.', type: RodadaAtualDto })
  @ApiNotFoundResponse({ description: 'Nenhum precompeonato encontrado.' })
  getRodadaAtual(): Promise<RodadaAtualDto | null> {
    return this.sorteioService.getRodadaAtual();
  }

  @Post('mesas/:mesaId/resultado')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmar resultado de uma mesa de torneio',
    description:
      'Persiste posicaoFinal/kills dos jogadores, empate e link da partida; marca a mesa como finalizada.',
  })
  @ApiParam({ name: 'mesaId', description: 'UUID da MesaTorneio' })
  @ApiOkResponse({ description: 'Rodada atualizada.', type: RodadaAtualDto })
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  @ApiNotFoundResponse()
  @ApiUnauthorizedResponse()
  submitMesaResultado(
    @Param('mesaId') mesaId: string,
    @Body() dto: SubmitTorneioMesaResultadoDto,
  ): Promise<RodadaAtualDto> {
    return this.sorteioService.submitMesaResultado(mesaId, dto);
  }

  @Post('rodadas/:rodadaId/finalizar')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Finalizar rodada (admin)',
    description:
      'Soma pontos nas inscrições (1º=3, 2º=1, empate=1), recalcula classificação e marca a rodada como finalizada.',
  })
  @ApiParam({ name: 'rodadaId', description: 'UUID da Rodada' })
  @ApiOkResponse({ description: 'Rodada finalizada.', type: RodadaAtualDto })
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  @ApiNotFoundResponse()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  finalizarRodada(@Param('rodadaId') rodadaId: string): Promise<RodadaAtualDto> {
    return this.sorteioService.finalizarRodada(rodadaId);
  }

  @Get('atual/sorteio')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Snapshot admin: classificação + check-in + mesas sorteadas' })
  @ApiOkResponse({ type: SorteioSnapshotDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  getSorteio(): Promise<SorteioSnapshotDto> {
    return this.sorteioService.getSnapshot();
  }

  @Post('atual/sortear-mesas')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sortear mesas (formato suíço) para a rodada de check-in' })
  @ApiOkResponse({ type: SorteioSnapshotDto })
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  sortearMesas(): Promise<SorteioSnapshotDto> {
    return this.sorteioService.sortearMesas();
  }

  @Get('atual/checkin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Status de check-in do jogador autenticado' })
  @ApiOkResponse({ type: CheckInStatusDto })
  getCheckIn(@Req() req: { user: AuthUser }): Promise<CheckInStatusDto> {
    return this.sorteioService.getCheckInStatus(req.user.id);
  }

  @Post('atual/checkin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer check-in na rodada atual' })
  @ApiOkResponse({ type: CheckInStatusDto })
  @ApiConflictResponse()
  @ApiNotFoundResponse()
  checkIn(@Req() req: { user: AuthUser }): Promise<CheckInStatusDto> {
    return this.sorteioService.checkIn(req.user.id);
  }

  @Delete('atual/checkin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar check-in (se mesas ainda não sorteadas)' })
  @ApiOkResponse({ type: CheckInStatusDto })
  @ApiConflictResponse()
  cancelCheckIn(@Req() req: { user: AuthUser }): Promise<CheckInStatusDto> {
    return this.sorteioService.cancelCheckIn(req.user.id);
  }
}
