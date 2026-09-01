import { Controller, Get, Post, Put, Patch, Delete, Body, Param, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MesasService } from './mesas.service';
import { MesaResponseDto } from './dto/mesa-response.dto';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { SubmitMesaResultadoDto } from './dto/submit-mesa-resultado.dto';
import { UpdateMesaLinkDto } from './dto/update-mesa-link.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Mesas')
@Controller('mesas')
export class MesasController {
  constructor(private readonly mesasService: MesasService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar mesas',
    description:
      'Retorna todas as mesas. O link da partida só é incluído para o dono e participantes.',
  })
  @ApiOkResponse({ description: 'Lista de mesas.', type: [MesaResponseDto] })
  findAll(@Request() req: { user: AuthUser }): Promise<MesaResponseDto[]> {
    return this.mesasService.findAll(req.user.id);
  }

  @Get('minhas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Minhas mesas casuais',
    description: 'Mesas casuais em que o usuário logado é o dono ou participa.',
  })
  @ApiOkResponse({ description: 'Minhas mesas casuais.', type: [MesaResponseDto] })
  minhasMesas(@Request() req: { user: AuthUser }): Promise<MesaResponseDto[]> {
    return this.mesasService.minhasMesas(req.user.id);
  }

  @Post(':id/entrar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Entrar em uma mesa casual aberta' })
  @ApiOkResponse({ description: 'Entrou na mesa.', type: MesaResponseDto })
  @ApiNotFoundResponse({ description: 'Mesa não encontrada.' })
  @ApiConflictResponse({ description: 'Mesa cheia, finalizada, ou já participa.' })
  entrar(
    @Request() req: { user: AuthUser },
    @Param('id') id: string,
  ): Promise<MesaResponseDto> {
    return this.mesasService.entrar(id, req.user.id);
  }

  @Post('convites/:conviteId/aceitar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceitar convite para uma mesa casual' })
  @ApiOkResponse({ description: 'Convite aceito; entrou na mesa.', type: MesaResponseDto })
  @ApiNotFoundResponse({ description: 'Convite não encontrado.' })
  @ApiConflictResponse({ description: 'Convite já respondido ou mesa cheia/finalizada.' })
  aceitarConvite(
    @Request() req: { user: AuthUser },
    @Param('conviteId') conviteId: string,
  ): Promise<MesaResponseDto> {
    return this.mesasService.aceitarConvite(conviteId, req.user.id);
  }

  @Post('convites/:conviteId/rejeitar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Rejeitar convite para uma mesa casual' })
  @ApiNotFoundResponse({ description: 'Convite não encontrado.' })
  @ApiConflictResponse({ description: 'Convite já respondido.' })
  async rejeitarConvite(
    @Request() req: { user: AuthUser },
    @Param('conviteId') conviteId: string,
  ): Promise<void> {
    await this.mesasService.rejeitarConvite(conviteId, req.user.id);
  }

  @Post(':id/convidar/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convidar um usuário da comunidade para a mesa' })
  @ApiOkResponse({ description: 'Convite enviado.' })
  @ApiNotFoundResponse({ description: 'Mesa ou usuário não encontrado.' })
  @ApiConflictResponse({ description: 'Já na mesa, mesa cheia, ou convite pendente.' })
  async convidar(
    @Request() req: { user: AuthUser },
    @Param('id') id: string,
    @Param('userId') paraUserId: string,
  ): Promise<{ success: boolean }> {
    await this.mesasService.convidar(id, req.user.id, paraUserId);
    return { success: true };
  }

  @Delete(':id/sair')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sair de uma mesa casual' })
  @ApiOkResponse({ description: 'Saiu da mesa.', type: MesaResponseDto })
  @ApiNotFoundResponse({ description: 'Mesa não encontrada.' })
  @ApiConflictResponse({ description: 'Você não está na mesa ou é o dono.' })
  sair(
    @Request() req: { user: AuthUser },
    @Param('id') id: string,
  ): Promise<MesaResponseDto> {
    return this.mesasService.sair(id, req.user.id);
  }

  @Delete(':id/jogadores/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover um jogador da mesa (apenas o dono)' })
  @ApiOkResponse({ description: 'Jogador removido.', type: MesaResponseDto })
  @ApiNotFoundResponse({ description: 'Mesa ou jogador não encontrado.' })
  @ApiConflictResponse({ description: 'Não é possível remover o dono.' })
  removerJogador(
    @Request() req: { user: AuthUser },
    @Param('id') id: string,
    @Param('userId') alvoUserId: string,
  ): Promise<MesaResponseDto> {
    return this.mesasService.removerJogador(id, req.user.id, alvoUserId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Apagar mesa casual (apenas o dono)' })
  @ApiNotFoundResponse({ description: 'Mesa não encontrada.' })
  async apagar(
    @Request() req: { user: AuthUser },
    @Param('id') id: string,
  ): Promise<void> {
    await this.mesasService.apagar(id, req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova mesa casual' })
  @ApiCreatedResponse({ description: 'Mesa criada.', type: MesaResponseDto })
  create(
    @Request() req: { user: AuthUser },
    @Body() dto: CreateMesaDto,
  ): Promise<MesaResponseDto> {
    return this.mesasService.create(req.user.id, dto);
  }

  @Put(':id/link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cadastrar link da mesa',
    description:
      'Atualiza o link da partida vinculado à mesa (Spelltable, Discord, etc.). Apenas o dono da mesa.',
  })
  @ApiOkResponse({ description: 'Link atualizado.', type: MesaResponseDto })
  @ApiNotFoundResponse({ description: 'Mesa não encontrada.' })
  @ApiConflictResponse({ description: 'Mesa já finalizada.' })
  @ApiBadRequestResponse({ description: 'Link inválido.' })
  updateLink(
    @Request() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateMesaLinkDto,
  ): Promise<MesaResponseDto> {
    return this.mesasService.updateLink(id, req.user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Editar mesa casual',
    description: 'Atualiza link e/ou descrição da mesa. Apenas o dono da mesa.',
  })
  @ApiOkResponse({ description: 'Mesa atualizada.', type: MesaResponseDto })
  @ApiNotFoundResponse({ description: 'Mesa não encontrada.' })
  @ApiConflictResponse({ description: 'Mesa já finalizada.' })
  @ApiBadRequestResponse({ description: 'Payload inválido.' })
  update(
    @Request() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateMesaDto,
  ): Promise<MesaResponseDto> {
    return this.mesasService.update(id, req.user.id, dto);
  }

  @Patch(':id/fechar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fechar mesa casual',
    description: 'Marca a mesa como finalizada. Apenas o dono da mesa.',
  })
  @ApiOkResponse({ description: 'Mesa fechada.', type: MesaResponseDto })
  @ApiNotFoundResponse({ description: 'Mesa não encontrada.' })
  @ApiConflictResponse({ description: 'Mesa já finalizada.' })
  fechar(
    @Request() req: { user: AuthUser },
    @Param('id') id: string,
  ): Promise<MesaResponseDto> {
    return this.mesasService.fechar(id, req.user.id);
  }

  @Post(':id/resultado')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar resultado da mesa',
    description:
      'Salva link da partida, posições finais, eliminações e marca a mesa como finalizada.',
  })
  @ApiOkResponse({ description: 'Resultado registrado.', type: MesaResponseDto })
  @ApiCreatedResponse({ description: 'Resultado registrado.', type: MesaResponseDto })
  @ApiNotFoundResponse({ description: 'Mesa não encontrada.' })
  @ApiConflictResponse({ description: 'Mesa já finalizada.' })
  @ApiBadRequestResponse({ description: 'Payload inválido para a mesa.' })
  submitResultado(
    @Param('id') id: string,
    @Body() dto: SubmitMesaResultadoDto,
  ): Promise<MesaResponseDto> {
    return this.mesasService.submitResultado(id, dto);
  }
}
