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
import { AnalisesService } from './analises.service';
import {
  CreateAnaliseSessaoDto,
  InscreverAnaliseDto,
  UpdateAnaliseSessaoDto,
  UpdateInscricaoAnaliseDto,
} from './dto/analise.dto';
import {
  AnaliseInscricaoAdminDto,
  AnaliseSessaoResponseDto,
} from './dto/analise-response.dto';

@ApiTags('Análises de Commander')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse()
@Controller('analises')
export class AnalisesController {
  constructor(private readonly service: AnalisesService) {}

  @Get('sessoes')
  @ApiOperation({ summary: 'Datas abertas de análise (apoiador ativo)' })
  @ApiOkResponse({ type: [AnaliseSessaoResponseDto] })
  @ApiForbiddenResponse()
  listar(@Req() req: { user: AuthUser }): Promise<AnaliseSessaoResponseDto[]> {
    return this.service.listar(req.user.id);
  }

  @Post('sessoes/:id/inscricao')
  @ApiOperation({ summary: 'Inscrever deck em uma data (vai para a lista de espera se lotada)' })
  @ApiCreatedResponse({ type: AnaliseSessaoResponseDto })
  @ApiConflictResponse()
  inscrever(
    @Req() req: { user: AuthUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InscreverAnaliseDto,
  ): Promise<AnaliseSessaoResponseDto> {
    return this.service.inscrever(req.user.id, id, dto);
  }

  @Patch('sessoes/:id/inscricao')
  @ApiOperation({ summary: 'Editar minha inscrição' })
  @ApiOkResponse({ type: AnaliseSessaoResponseDto })
  @ApiNotFoundResponse()
  atualizarMinha(
    @Req() req: { user: AuthUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInscricaoAnaliseDto,
  ): Promise<AnaliseSessaoResponseDto> {
    return this.service.atualizarMinha(req.user.id, id, dto);
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
  @ApiOkResponse({ type: [AnaliseSessaoResponseDto] })
  @ApiForbiddenResponse()
  listarAdmin(): Promise<AnaliseSessaoResponseDto[]> {
    return this.service.listarAdmin();
  }

  @Post('admin/sessoes')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Criar data de análise (admin)' })
  @ApiCreatedResponse({ type: AnaliseSessaoResponseDto })
  criar(@Body() dto: CreateAnaliseSessaoDto): Promise<AnaliseSessaoResponseDto> {
    return this.service.criar(dto);
  }

  @Patch('admin/sessoes/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Editar data de análise (admin)' })
  @ApiOkResponse({ type: AnaliseSessaoResponseDto })
  @ApiNotFoundResponse()
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAnaliseSessaoDto,
  ): Promise<AnaliseSessaoResponseDto> {
    return this.service.atualizar(id, dto);
  }

  @Delete('admin/sessoes/:id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover data de análise e suas inscrições (admin)' })
  @ApiNotFoundResponse()
  async remover(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.service.remover(id);
  }

  @Get('admin/sessoes/:id/inscricoes')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Inscrições de uma data, com detalhes (admin)' })
  @ApiOkResponse({ type: [AnaliseInscricaoAdminDto] })
  listarInscricoesAdmin(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AnaliseInscricaoAdminDto[]> {
    return this.service.listarInscricoesAdmin(id);
  }

  @Delete('admin/inscricoes/:id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover inscrição (admin); a lista de espera avança' })
  @ApiNotFoundResponse()
  async removerInscricaoAdmin(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.service.removerInscricaoAdmin(id);
  }
}
