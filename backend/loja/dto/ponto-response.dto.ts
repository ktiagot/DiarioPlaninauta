import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PontoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'credito' })
  tipo: string;

  @ApiProperty()
  quantidade: number;

  @ApiProperty()
  descricao: string;

  @ApiPropertyOptional()
  referenciaTipo: string | null;

  @ApiPropertyOptional()
  referenciaId: string | null;

  @ApiProperty()
  createdAt: Date;
}
