import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
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
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrecompeonatoService } from './precompeonato.service';
import { SorteioService } from './sorteio/sorteio.service';
import { CampeonatoAdminService } from './campeonato-admin.service';
import { CreateInscricaoDto } from './dto/create-inscricao.dto';
import { CreateCampeonatoDto } from './dto/create-campeonato.dto';
import { UpdateCampeonatoDto } from './dto/update-campeonato.dto';
import { UpdateCampeonatoStatusDto } from './dto/update-campeonato-status.dto';
import { CampeonatoAtualResponseDto } from './dto/campeonato-atual-response.dto';
import { CampeonatoAdminResponseDto } from './dto/campeonato-admin-response.dto';
import { InscricaoResponseDto } from './dto/inscricao-response.dto';
import { JogadorPrecompeonatoResponseDto } from './dto/jogador-precompeonato-response.dto';
import { InscritoAdminResponseDto } from './dto/inscrito-admin-response.dto';
import { UpdateInscricaoAtivoDto } from './dto/update-inscricao-ativo.dto';
import { EstatisticasFullResponseDto } from './dto/estatisticas-response.dto';
import { DashboardMetricasResponseDto } from './dto/dashboard-metricas.dto';
import { MinhasMesasResponseDto } from './dto/minhas-mesas-response.dto';
import { CheckInStatusDto, SorteioSnapshotDto } from './dto/sorteio.dto';
import { CreateRodadaDto } from './dto/create-rodada.dto';
import { AdminCheckInDto } from './dto/admin-checkin.dto';
import { RodadasListResponseDto } from './dto/rodadas-list.dto';
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
    private readonly campeonatoAdminService: CampeonatoAdminService,
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

  @Get('atual/inscritos/admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar inscritos do campeonato atual (admin)',
    description:
      'Retorna todos os inscritos (ativos e suspensos) com e-mail, deck, pontos e vitórias.',
  })
  @ApiOkResponse({
    description: 'Lista de inscritos para admin.',
    type: [InscritoAdminResponseDto],
  })
  @ApiNotFoundResponse({ description: 'Nenhum precompeonato encontrado.' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  listInscritosAdmin(): Promise<InscritoAdminResponseDto[]> {
    return this.precompeonatoService.listInscritosAdmin();
  }

  @Patch('inscricoes/:id/ativo')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suspender ou reativar inscrito no campeonato (admin)',
    description:
      'Suspensão soft: remove do ranking e sorteios futuros; mantém pontos e mesas já jogadas.',
  })
  @ApiParam({ name: 'id', description: 'UUID da inscrição' })
  @ApiOkResponse({ type: InscritoAdminResponseDto })
  @ApiNotFoundResponse()
  @ApiConflictResponse({ description: 'Campeonato encerrado.' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  setInscricaoAtivo(
    @Param('id') id: string,
    @Body() dto: UpdateInscricaoAtivoDto,
  ): Promise<InscritoAdminResponseDto> {
    return this.precompeonatoService.setInscricaoAtivo(id, dto.ativo);
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
      'Persiste posicaoFinal/kills, empate e link. Jogador da mesa grava sem validar; admin grava e valida.',
  })
  @ApiParam({ name: 'mesaId', description: 'UUID da MesaTorneio' })
  @ApiOkResponse({ description: 'Rodada atualizada.', type: RodadaAtualDto })
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  @ApiNotFoundResponse()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  submitMesaResultado(
    @Param('mesaId') mesaId: string,
    @Body() dto: SubmitTorneioMesaResultadoDto,
    @Req() req: { user: AuthUser },
  ): Promise<RodadaAtualDto> {
    return this.sorteioService.submitMesaResultado(mesaId, dto, {
      id: req.user.id,
      isAdmin: req.user.isAdmin,
    });
  }

  @Post('rodadas/:rodadaId/finalizar')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Finalizar rodada (admin)',
    description:
      'Exige todas as mesas validadas. Soma pontos nas inscrições (1º=3, 2º=1, empate=1), recalcula classificação e marca a rodada como finalizada.',
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

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dashboard de métricas (admin)' })
  @ApiOkResponse({ type: DashboardMetricasResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  getDashboard(): Promise<DashboardMetricasResponseDto> {
    return this.precompeonatoService.getDashboardMetricas();
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

  @Get('atual/rodadas')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar rodadas do campeonato atual (admin)' })
  @ApiOkResponse({ type: RodadasListResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  listRodadas(): Promise<RodadasListResponseDto> {
    return this.sorteioService.listRodadas();
  }

  @Post('atual/rodadas')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Abrir nova rodada para check-in (admin)' })
  @ApiOkResponse({ type: SorteioSnapshotDto })
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  abrirRodada(@Body() dto: CreateRodadaDto): Promise<SorteioSnapshotDto> {
    return this.sorteioService.abrirRodada(dto);
  }

  @Patch('atual/checkin/admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar ou remover check-in de um inscrito (admin)' })
  @ApiOkResponse({ type: SorteioSnapshotDto })
  @ApiConflictResponse()
  @ApiNotFoundResponse()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  adminCheckIn(@Body() dto: AdminCheckInDto): Promise<SorteioSnapshotDto> {
    return this.sorteioService.adminToggleCheckIn(dto.inscricaoId, dto.checkIn);
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

  @Post('atual/re-sortear-mesas')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Re-sortear mesas (admin)',
    description:
      'Apaga mesas sem resultado e gera novo pareamento com os mesmos check-ins.',
  })
  @ApiOkResponse({ type: SorteioSnapshotDto })
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  reSortearMesas(): Promise<SorteioSnapshotDto> {
    return this.sorteioService.reSortearMesas();
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

  @Get('campeonatos')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar campeonatos (admin)' })
  @ApiOkResponse({ type: [CampeonatoAdminResponseDto] })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  listCampeonatos(): Promise<CampeonatoAdminResponseDto[]> {
    return this.campeonatoAdminService.list();
  }

  @Post('campeonatos')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar campeonato (admin)' })
  @ApiCreatedResponse({ type: CampeonatoAdminResponseDto })
  @ApiConflictResponse()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  createCampeonato(@Body() dto: CreateCampeonatoDto): Promise<CampeonatoAdminResponseDto> {
    return this.campeonatoAdminService.create(dto);
  }

  @Patch('campeonatos/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar dados do campeonato (admin)' })
  @ApiOkResponse({ type: CampeonatoAdminResponseDto })
  @ApiNotFoundResponse()
  @ApiConflictResponse()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  updateCampeonato(
    @Param('id') id: string,
    @Body() dto: UpdateCampeonatoDto,
  ): Promise<CampeonatoAdminResponseDto> {
    return this.campeonatoAdminService.update(id, dto);
  }

  @Patch('campeonatos/:id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar status do campeonato (admin)' })
  @ApiOkResponse({ type: CampeonatoAdminResponseDto })
  @ApiNotFoundResponse()
  @ApiConflictResponse()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  updateCampeonatoStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCampeonatoStatusDto,
  ): Promise<CampeonatoAdminResponseDto> {
    return this.campeonatoAdminService.updateStatus(id, dto.status);
  }

  @Post('campeonatos/:id/banner')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de banner do campeonato (admin)' })
  @ApiOkResponse({ type: CampeonatoAdminResponseDto })
  @ApiNotFoundResponse()
  @ApiConflictResponse()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  updateBanner(
    @Param('id') id: string,
    @UploadedFile() file?: { mimetype: string; buffer: Buffer; size: number },
  ): Promise<CampeonatoAdminResponseDto> {
    if (!file) throw new BadRequestException('Envie o arquivo no campo file.');
    return this.campeonatoAdminService.updateBanner(id, file);
  }
}
