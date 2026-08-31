import { ApiProperty } from '@nestjs/swagger';

export class ProximaRodadaDto {
  @ApiProperty({ example: 3, description: 'Número da rodada' })
  numero: number;

  @ApiProperty({ example: '2026-09-05', description: 'Data da rodada (YYYY-MM-DD)' })
  dataRodada: string;

  @ApiProperty({ example: 2, description: 'Dias restantes até a rodada (0 = hoje)' })
  diasRestantes: number;
}
