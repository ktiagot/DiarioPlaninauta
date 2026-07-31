import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreditarPontosDto {
  @ApiProperty({ example: 'uuid-do-usuario' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  quantidade: number;

  @ApiProperty({ example: 'Bônus por participação no campeonato' })
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiPropertyOptional({ example: 'campeonato', description: 'campeonato, mesa_casual, loja, manual' })
  @IsOptional()
  @IsString()
  referenciaTipo?: string;

  @ApiPropertyOptional({ example: 'uuid-da-referencia' })
  @IsOptional()
  @IsString()
  referenciaId?: string;
}
