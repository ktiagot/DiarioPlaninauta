import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
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
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { PreconsService } from './precons.service';
import { CreatePreconDto, UpdatePreconDto } from './dto/create-precon.dto';
import {
  PreconComandanteResponseDto,
  PreconListItemDto,
  PreconResponseDto,
} from './dto/precon-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Precons')
@Controller('precons')
export class PreconsController {
  constructor(private readonly preconsService: PreconsService) {}

  @Get()
  @ApiOperation({ summary: 'Buscar precons ativos', description: 'Endpoint público.' })
  @ApiQuery({ name: 'busca', required: false })
  @ApiOkResponse({ description: 'Lista de precons.', type: [PreconListItemDto] })
  search(@Query('busca') busca?: string): Promise<PreconListItemDto[]> {
    return this.preconsService.search(busca);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Listar todos os precons (admin)' })
  @ApiOkResponse({ description: 'Lista completa incluindo banidos.', type: [PreconResponseDto] })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  listAdmin(): Promise<PreconResponseDto[]> {
    return this.preconsService.listAdmin();
  }

  @Get(':id/comandantes')
  @ApiOperation({ summary: 'Comandantes de um precon' })
  @ApiOkResponse({ description: 'Lista de comandantes.', type: [PreconComandanteResponseDto] })
  @ApiNotFoundResponse({ description: 'Precon não encontrado ou banido.' })
  listComandantes(@Param('id') id: string): Promise<PreconComandanteResponseDto[]> {
    return this.preconsService.listComandantes(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar precon (admin)' })
  @ApiCreatedResponse({ description: 'Precon criado.', type: PreconResponseDto })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  create(@Body() dto: CreatePreconDto): Promise<PreconResponseDto> {
    return this.preconsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Editar precon (admin)' })
  @ApiOkResponse({ description: 'Precon atualizado.', type: PreconResponseDto })
  @ApiNotFoundResponse({ description: 'Precon não encontrado.' })
  @ApiConflictResponse({ description: 'Comandante em uso ou conflito de integridade.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  update(@Param('id') id: string, @Body() dto: UpdatePreconDto): Promise<PreconResponseDto> {
    return this.preconsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir precon (admin)' })
  @ApiNotFoundResponse({ description: 'Precon não encontrado.' })
  @ApiConflictResponse({ description: 'Precon vinculado a inscrições ou mesas.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.preconsService.remove(id);
  }
}
