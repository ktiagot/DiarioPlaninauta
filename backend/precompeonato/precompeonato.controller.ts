import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
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
} from '@nestjs/swagger';
import { PrecompeonatoService } from './precompeonato.service';
import { CreateInscricaoDto } from './dto/create-inscricao.dto';
import { CampeonatoAtualResponseDto } from './dto/campeonato-atual-response.dto';
import { InscricaoResponseDto } from './dto/inscricao-response.dto';
import { JogadorPrecompeonatoResponseDto } from './dto/jogador-precompeonato-response.dto';

@ApiTags('Precompeonato')
@Controller('precompeonato')
export class PrecompeonatoController {
  constructor(private readonly precompeonatoService: PrecompeonatoService) {}

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

  @Post('inscricoes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Inscrever-se no precompeonato atual',
    description:
      'Cria inscrição quando o campeonato atual está com Inscrições abertas. O email deve pertencer a um usuário cadastrado.',
  })
  @ApiCreatedResponse({ description: 'Inscrição criada.', type: InscricaoResponseDto })
  @ApiBadRequestResponse({ description: 'Termos não aceitos ou payload inválido.' })
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
}
