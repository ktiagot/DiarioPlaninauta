import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, Min } from 'class-validator';

export class CreateRodadaDto {
  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  numero: number;

  @ApiProperty({ example: '2026-08-26', description: 'Data da rodada (YYYY-MM-DD)' })
  @IsDateString()
  dataRodada: string;
}
