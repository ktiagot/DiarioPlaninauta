import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProdutoDto {
  @ApiProperty({ example: 'Playmat Exclusivo Planinauta' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiPropertyOptional({ example: 'Playmat com arte exclusiva do canal' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ example: 500 })
  @IsInt()
  @Min(1)
  precoPontos: number;

  @ApiPropertyOptional({ example: 'https://example.com/imagem.png' })
  @IsOptional()
  @IsString()
  imagemUrl?: string;

  @ApiPropertyOptional({ example: 10, description: 'null = estoque ilimitado' })
  @IsOptional()
  @IsInt()
  @Min(0)
  estoque?: number;
}
