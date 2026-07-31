import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSugestaoDto } from './dto/create-sugestao.dto';
import { SugestoesService } from './sugestoes.service';

@ApiTags('Sugestões')
@Controller('sugestoes')
export class SugestoesController {
  constructor(private readonly sugestoesService: SugestoesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar uma sugestão por email' })
  @ApiResponse({ status: 200, description: 'Sugestão enviada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro ao enviar email' })
  async create(
    @Body() dto: CreateSugestaoDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.sugestoesService.enviar(dto);
    return { success: true, message: 'Sugestão enviada com sucesso!' };
  }
}
