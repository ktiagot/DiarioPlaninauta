import { Controller, Get, Post, Put, Body, Param, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Mesas')
@Controller('mesas')
export class MesasController {
  constructor(private readonly mesasService: MesasService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar mesas',
    description: 'Retorna todas as mesas com jogadores (dados de users) e eliminações.',
  })
  @ApiOkResponse({ description: 'Lista de mesas.', type: [MesaResponseDto] })
  findAll(): Promise<MesaResponseDto[]> {
    return this.mesasService.findAll();
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
  @ApiOperation({
    summary: 'Cadastrar link da mesa',
    description: 'Atualiza o link da partida vinculado à mesa (Spelltable, Discord, etc.).',
  })
  @ApiOkResponse({ description: 'Link atualizado.', type: MesaResponseDto })
  @ApiNotFoundResponse({ description: 'Mesa não encontrada.' })
  @ApiConflictResponse({ description: 'Mesa já finalizada.' })
  @ApiBadRequestResponse({ description: 'Link inválido.' })
  updateLink(
    @Param('id') id: string,
    @Body() dto: UpdateMesaLinkDto,
  ): Promise<MesaResponseDto> {
    return this.mesasService.updateLink(id, dto);
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
