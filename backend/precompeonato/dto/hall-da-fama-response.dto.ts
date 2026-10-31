import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HallDaFamaEntryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  campeonatoId: string;

  @ApiProperty({ example: 'Precompeonato #1' })
  campeonatoNome: string;

  @ApiProperty({ example: '#1' })
  edicao: string;

  @ApiProperty({ example: '2026-01-10' })
  dataInicio: string;

  @ApiPropertyOptional({ example: 'João', nullable: true })
  campeaoNome: string | null;

  @ApiPropertyOptional({ example: 'joaosilva', nullable: true })
  campeaoNick: string | null;

  @ApiPropertyOptional({ example: 'Atraxa, Praetors\' Voice', nullable: true })
  comandante: string | null;

  @ApiPropertyOptional({ example: 'Precon Atraxa', nullable: true })
  deckNome: string | null;

  @ApiPropertyOptional({ example: 'Anãos', nullable: true })
  exercito: string | null;

  @ApiPropertyOptional({ example: 18, nullable: true })
  pontos: number | null;
}
