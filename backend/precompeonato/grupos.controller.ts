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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { GruposService } from './grupos.service';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
import { GrupoResponseDto } from './dto/grupo-response.dto';

@ApiTags('Precompeonato — Grupos')
@Controller('precompeonato')
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Get('atual/grupos')
  @ApiOperation({
    summary: 'Grupos do campeonato atual (público)',
    description:
      'Lista os grupos do campeonato atual. Vazio se o campeonato não usa grupos. Usado no formulário de inscrição.',
  })
  @ApiOkResponse({ description: 'Grupos do campeonato atual.', type: [GrupoResponseDto] })
  listarDoAtual(): Promise<GrupoResponseDto[]> {
    return this.gruposService.listarDoCampeonatoAtual();
  }

  @Get('campeonatos/:campeonatoId/grupos')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar grupos de um campeonato (admin)' })
  @ApiParam({ name: 'campeonatoId', description: 'ID do campeonato' })
  @ApiOkResponse({ description: 'Grupos do campeonato.', type: [GrupoResponseDto] })
  listarPorCampeonato(
    @Param('campeonatoId') campeonatoId: string,
  ): Promise<GrupoResponseDto[]> {
    return this.gruposService.listarPorCampeonato(campeonatoId);
  }

  @Post('campeonatos/:campeonatoId/grupos')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar grupo em um campeonato (admin)' })
  @ApiParam({ name: 'campeonatoId', description: 'ID do campeonato' })
  @ApiCreatedResponse({ description: 'Grupo criado.', type: GrupoResponseDto })
  criar(
    @Param('campeonatoId') campeonatoId: string,
    @Body() dto: CreateGrupoDto,
  ): Promise<GrupoResponseDto> {
    return this.gruposService.criar(campeonatoId, dto);
  }

  @Patch('grupos/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar grupo (admin)' })
  @ApiParam({ name: 'id', description: 'ID do grupo' })
  @ApiOkResponse({ description: 'Grupo atualizado.', type: GrupoResponseDto })
  @ApiNotFoundResponse({ description: 'Grupo não encontrado.' })
  atualizar(
    @Param('id') id: string,
    @Body() dto: UpdateGrupoDto,
  ): Promise<GrupoResponseDto> {
    return this.gruposService.atualizar(id, dto);
  }

  @Delete('grupos/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover grupo (admin)' })
  @ApiParam({ name: 'id', description: 'ID do grupo' })
  @ApiNotFoundResponse({ description: 'Grupo não encontrado.' })
  async remover(@Param('id') id: string): Promise<void> {
    await this.gruposService.remover(id);
  }
}
