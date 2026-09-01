import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
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
  ApiBearerAuth,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { NotificacoesService } from './notificacoes.service';
import { CreateNotificacaoDto } from './dto/create-notificacao.dto';
import { NotificacaoResponseDto } from './dto/notificacao-response.dto';
import { ContadorNaoLidasDto } from './dto/contador-nao-lidas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Notificações')
@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Listar notificações do usuário logado (últimas 20)' })
  @ApiOkResponse({ description: 'Lista de notificações.', type: [NotificacaoResponseDto] })
  listar(@Request() req: { user: AuthUser }): Promise<NotificacaoResponseDto[]> {
    return this.notificacoesService.listar(req.user.id);
  }

  @Get('nao-lidas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Contar notificações não lidas' })
  @ApiOkResponse({ description: 'Contagem de não lidas.', type: ContadorNaoLidasDto })
  contarNaoLidas(@Request() req: { user: AuthUser }): Promise<ContadorNaoLidasDto> {
    return this.notificacoesService.contarNaoLidas(req.user.id);
  }

  @Patch(':id/ler')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  @ApiOkResponse({ description: 'Notificação marcada como lida.', type: NotificacaoResponseDto })
  @ApiNotFoundResponse({ description: 'Notificação não encontrada.' })
  marcarComoLida(
    @Param('id') id: string,
    @Request() req: { user: AuthUser },
  ): Promise<NotificacaoResponseDto> {
    return this.notificacoesService.marcarComoLida(id, req.user.id);
  }

  @Patch('ler-todas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  @ApiOkResponse({ description: 'Todas marcadas como lidas.' })
  marcarTodasComoLidas(
    @Request() req: { user: AuthUser },
  ): Promise<{ count: number }> {
    return this.notificacoesService.marcarTodasComoLidas(req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir uma notificação' })
  @ApiNotFoundResponse({ description: 'Notificação não encontrada.' })
  async excluir(
    @Param('id') id: string,
    @Request() req: { user: AuthUser },
  ): Promise<void> {
    await this.notificacoesService.excluir(id, req.user.id);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Excluir todas as notificações do usuário logado' })
  @ApiOkResponse({ description: 'Notificações excluídas.' })
  excluirTodas(@Request() req: { user: AuthUser }): Promise<{ count: number }> {
    return this.notificacoesService.excluirTodas(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar notificação (admin)' })
  @ApiCreatedResponse({ description: 'Notificação criada.', type: NotificacaoResponseDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  criar(@Body() dto: CreateNotificacaoDto): Promise<NotificacaoResponseDto> {
    return this.notificacoesService.criar(dto);
  }
}
