import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthUser } from '../auth/strategies/jwt.strategy';
import { ComunidadeService } from './comunidade.service';
import { JogadorAdminResponseDto } from './dto/jogador-admin-response.dto';
import { JogadorComunidadeResponseDto } from './dto/jogador-comunidade-response.dto';
import { ContatoResponseDto } from './dto/contato-response.dto';
import { VerificarApoiaResponseDto } from './dto/verificar-apoia-response.dto';

interface AuthenticatedRequest {
  user: AuthUser;
}

@ApiTags('Comunidade')
@Controller('comunidade')
export class ComunidadeController {
  constructor(private readonly comunidadeService: ComunidadeService) {}

  @Get('jogadores')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar jogadores da comunidade',
    description:
      'Retorna todos os apoiadores ativos com dados públicos. Aceita filtros por busca, cidade, formato e disponibilidade.',
  })
  @ApiQuery({ name: 'busca', required: false, description: 'Busca por nick, nome ou cidade' })
  @ApiQuery({ name: 'cidade', required: false, description: 'Filtrar por cidade' })
  @ApiQuery({ name: 'formato', required: false, description: 'Filtrar por formato (ex: Commander)' })
  @ApiQuery({ name: 'disponibilidade', required: false, description: 'Filtrar por dia disponível' })
  @ApiOkResponse({
    description: 'Lista de jogadores da comunidade.',
    type: [JogadorComunidadeResponseDto],
  })
  listarJogadores(
    @Query('busca') busca?: string,
    @Query('cidade') cidade?: string,
    @Query('formato') formato?: string,
    @Query('disponibilidade') disponibilidade?: string,
  ): Promise<JogadorComunidadeResponseDto[]> {
    return this.comunidadeService.listarJogadores({
      busca,
      cidade,
      formato,
      disponibilidade,
    });
  }

  @Get('jogadores/:userId/contato')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ver contato de um jogador',
    description:
      'Retorna dados de contato se ambos se favoritaram mutuamente. Caso contrário, retorna { mutuo: false }.',
  })
  @ApiParam({ name: 'userId', description: 'ID do jogador cujo contato se deseja ver' })
  @ApiOkResponse({ description: 'Dados de contato ou indicação de não mútuo.', type: ContatoResponseDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  obterContato(
    @Request() req: AuthenticatedRequest,
    @Param('userId') userId: string,
  ): Promise<ContatoResponseDto> {
    return this.comunidadeService.obterContato(req.user.id, userId);
  }

  @Get('favoritos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar meus favoritos',
    description: 'Retorna os IDs dos usuários que o usuário autenticado favoritou.',
  })
  @ApiOkResponse({ description: 'Lista de IDs de favoritos.', type: [String] })
  listarFavoritos(@Request() req: AuthenticatedRequest): Promise<string[]> {
    return this.comunidadeService.listarFavoritos(req.user.id);
  }

  @Post('favoritos/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Favoritar um jogador',
    description: 'Adiciona o jogador à lista de favoritos do usuário autenticado.',
  })
  @ApiParam({ name: 'userId', description: 'ID do jogador a ser favoritado' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  async favoritar(
    @Request() req: AuthenticatedRequest,
    @Param('userId') userId: string,
  ): Promise<void> {
    await this.comunidadeService.favoritar(req.user.id, userId);
  }

  @Delete('favoritos/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desfavoritar um jogador',
    description: 'Remove o jogador da lista de favoritos do usuário autenticado.',
  })
  @ApiParam({ name: 'userId', description: 'ID do jogador a ser desfavoritado' })
  async desfavoritar(
    @Request() req: AuthenticatedRequest,
    @Param('userId') userId: string,
  ): Promise<void> {
    await this.comunidadeService.desfavoritar(req.user.id, userId);
  }

  @Get('metricas')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Métricas da comunidade (admin)',
    description: 'Retorna métricas gerais da comunidade: membros, favoritos, top cidades e formatos.',
  })
  @ApiOkResponse({ description: 'Métricas da comunidade.' })
  getMetricas() {
    return this.comunidadeService.getMetricas();
  }

  @Get('admin/jogadores')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar jogadores do sistema (admin)',
    description: 'Retorna todos os usuários cadastrados com flags de apoiador e última verificação.',
  })
  @ApiOkResponse({
    description: 'Lista de jogadores para administração.',
    type: [JogadorAdminResponseDto],
  })
  listAdminJogadores(): Promise<JogadorAdminResponseDto[]> {
    return this.comunidadeService.listAdminJogadores();
  }

  @Post('admin/apoia/verificar/:email')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar apoiador na APOIA.se (admin)',
    description:
      'Consulta a API APOIA.se e sincroniza isApoiadorAtivo, isExApoiador e demais flags no banco.',
  })
  @ApiParam({ name: 'email', description: 'E-mail do usuário a verificar' })
  @ApiOkResponse({
    description: 'Resultado da verificação.',
    type: VerificarApoiaResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  verificarApoia(@Param('email') email: string): Promise<VerificarApoiaResponseDto> {
    return this.comunidadeService.verificarESincronizar(decodeURIComponent(email));
  }

  @Post('admin/apoia/verificar-todos')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revalidar todos os apoiadores na APOIA.se (admin)',
    description:
      'Consulta a APOIA.se para todos os usuários e sincroniza as flags no banco. A mesma rotina roda automaticamente todo domingo.',
  })
  @ApiOkResponse({
    description: 'Resumo da sincronização (total, ativos, inativados, falhas).',
  })
  sincronizarTodos(): Promise<{
    total: number;
    ativos: number;
    inativados: number;
    falhas: number;
  }> {
    return this.comunidadeService.sincronizarTodosApoiadores();
  }
}
