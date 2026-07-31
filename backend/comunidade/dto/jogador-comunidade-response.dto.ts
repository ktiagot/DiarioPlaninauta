import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JogadorComunidadeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nick: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  cidade: string;

  @ApiPropertyOptional()
  estado?: string | null;

  @ApiProperty({ type: [String] })
  formatos: string[];

  @ApiProperty({ type: [String] })
  diasDisponiveis: string[];

  @ApiProperty({ type: [String] })
  horarios: string[];

  @ApiPropertyOptional()
  foto?: string | null;

  @ApiPropertyOptional()
  apoiandoDesde?: Date | null;
}
