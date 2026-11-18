import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthUser } from '../auth/strategies/jwt.strategy';
import { MesaoLiveService } from './mesao-live.service';
import {
  CreateMesaoSessaoDto,
  InscreverMesaoDto,
  UpdateMesaoSessaoDto,
} from './dto/mesao-live.dto';
import {
  MesaoInscricaoAdminDto,
  MesaoSessaoResponseDto,
} from './dto/mesao-live-response.dto';

@ApiTags('Mesão ao Vivo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse()
@Controller('mesao-live')
export class MesaoLiveController {
  constructor(private readonly service: MesaoLiveService) {}

  @Get('sessoes')
  @ApiOperation({ summary: 'Datas abertas do mesão (apoiador ativo)' })
  @ApiOkResponse({ type: [MesaoSessaoResponseDto] })
  @ApiForbiddenResponse()
  listar(@Req() req: { user: AuthUser }): Promise<MesaoSessaoResponseDto[]> {
    return this.service.listar(req.user.id);
  }

  @Post('sessoes/:id/inscricao')
  @ApiOperation({ summary: 'Inscrever-se como jogador ou suplente (troca o tipo se já inscrito na data)' })
  @ApiCreatedResponse({ type: MesaoSessaoResponseDto })
  @ApiConflictResponse()
  inscrever(
    @Req() req: { user: AuthUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InscreverMesaoDto,
  ): Promise<MesaoSessaoResponseDto> {
    return this.service.inscrever(req.user.id, id, dto);
  }

  @Delete('sessoes/:id/inscricao')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar minha inscrição' })
  @ApiNotFoundResponse()
  async cancelar(
    @Req() req: { user: AuthUser },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.service.cancelar(req.user.id, id);
  }

  // ---------- admin ----------

  @Get('admin/sessoes')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Todas as datas (admin)' })
  @ApiOkResponse({ type: [MesaoSessaoResponseDto] })
  @ApiForbiddenResponse()
  listarAdmin(): Promise<MesaoSessaoResponseDto[]> {
    return this.service.listarAdmin();
  }

  @Post('admin/sessoes')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Criar data de mesão (admin)' })
  @ApiCreatedResponse({ type: MesaoSessaoResponseDto })
  criar(@Body() dto: CreateMesaoSessaoDto): Promise<MesaoSessaoResponseDto> {
    return this.service.criar(dto);
  }

  @Patch('admin/sessoes/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Editar data de mesão (admin)' })
  @ApiOkResponse({ type: MesaoSessaoResponseDto })
  @ApiNotFoundResponse()
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMesaoSessaoDto,
  ): Promise<MesaoSessaoResponseDto> {
    return this.service.atualizar(id, dto);
  }

  @Delete('admin/sessoes/:id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover data de mesão e suas inscrições (admin)' })
  @ApiNotFoundResponse()
  async remover(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.service.remover(id);
  }

  @Get('admin/sessoes/:id/inscricoes')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Inscrições de uma data, com detalhes (admin)' })
  @ApiOkResponse({ type: [MesaoInscricaoAdminDto] })
  listarInscricoesAdmin(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MesaoInscricaoAdminDto[]> {
    return this.service.listarInscricoesAdmin(id);
  }

  @Delete('admin/inscricoes/:id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover inscrição (admin)' })
  @ApiNotFoundResponse()
  async removerInscricaoAdmin(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.service.removerInscricaoAdmin(id);
  }
}

