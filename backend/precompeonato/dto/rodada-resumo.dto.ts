import { ApiProperty } from '@nestjs/swagger';

export class RodadaResumoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 2 })
  numero: number;

  @ApiProperty({ example: '12/11/2026', description: 'Data formatada da rodada.' })
  dataRodada: string;

  @ApiProperty({ example: true })
  finalizada: boolean;

  @ApiProperty({ example: 12, description: 'Quantidade de mesas sorteadas.' })
  totalMesas: number;
}