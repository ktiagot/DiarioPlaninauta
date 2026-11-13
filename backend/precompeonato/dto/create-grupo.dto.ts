import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateGrupoDto {
  @ApiProperty({ example: 'Anãos' })
  @IsString()
  @MinLength(1, { message: 'Informe o nome do grupo.' })
  nome: string;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;
}
