import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { TemaService } from './tema.service';
import { TemaResponseDto } from './dto/tema-response.dto';
import { UpdateTemaDto } from './dto/update-tema.dto';

@ApiTags('Tema')
@Controller('tema')
export class TemaController {
  constructor(private readonly temaService: TemaService) {}

  @Get()
  @ApiOperation({
    summary: 'Obter o tema atual do portal',
    description: 'Público — usado pelo frontend no boot para aplicar as cores.',
  })
  @ApiOkResponse({ description: 'Tema atual.', type: TemaResponseDto })
  obter(): Promise<TemaResponseDto> {
    return this.temaService.obter();
  }

  @Put()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Atualizar o tema do portal (admin)' })
  @ApiOkResponse({ description: 'Tema atualizado.', type: TemaResponseDto })
  atualizar(@Body() dto: UpdateTemaDto): Promise<TemaResponseDto> {
    return this.temaService.atualizar(dto);
  }
}
