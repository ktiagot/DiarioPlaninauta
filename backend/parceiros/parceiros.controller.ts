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
import { ParceirosService } from './parceiros.service';
import { CreateParceiroDto } from './dto/create-parceiro.dto';
import { UpdateParceiroDto } from './dto/update-parceiro.dto';
import { ParceiroResponseDto } from './dto/parceiro-response.dto';

@ApiTags('Parceiros')
@Controller('parceiros')
export class ParceirosController {
  constructor(private readonly parceirosService: ParceirosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar parceiros ativos (público)' })
  @ApiOkResponse({ description: 'Parceiros ativos.', type: [ParceiroResponseDto] })
  listarPublico(): Promise<ParceiroResponseDto[]> {
    return this.parceirosService.listarPublico();
  }

  @Post(':id/clique')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Registrar clique em um parceiro',
    description: 'Incrementa o contador de cliques. Público; silencioso se o parceiro não existir.',
  })
  @ApiParam({ name: 'id', description: 'ID do parceiro' })
  async registrarClique(@Param('id') id: string): Promise<void> {
    await this.parceirosService.registrarClique(id);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os parceiros (admin)' })
  @ApiOkResponse({ description: 'Todos os parceiros.', type: [ParceiroResponseDto] })
  listarAdmin(): Promise<ParceiroResponseDto[]> {
    return this.parceirosService.listarAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar parceiro (admin)' })
  @ApiCreatedResponse({ description: 'Parceiro criado.', type: ParceiroResponseDto })
  criar(@Body() dto: CreateParceiroDto): Promise<ParceiroResponseDto> {
    return this.parceirosService.criar(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar parceiro (admin)' })
  @ApiOkResponse({ description: 'Parceiro atualizado.', type: ParceiroResponseDto })
  @ApiNotFoundResponse({ description: 'Parceiro não encontrado.' })
  atualizar(
    @Param('id') id: string,
    @Body() dto: UpdateParceiroDto,
  ): Promise<ParceiroResponseDto> {
    return this.parceirosService.atualizar(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover parceiro (admin)' })
  @ApiNotFoundResponse({ description: 'Parceiro não encontrado.' })
  async remover(@Param('id') id: string): Promise<void> {
    await this.parceirosService.remover(id);
  }
}
