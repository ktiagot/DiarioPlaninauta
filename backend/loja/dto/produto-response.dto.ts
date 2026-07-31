import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProdutoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiPropertyOptional()
  descricao: string | null;

  @ApiProperty()
  precoPontos: number;

  @ApiPropertyOptional()
  imagemUrl: string | null;

  @ApiPropertyOptional({ description: 'null = estoque ilimitado' })
  estoque: number | null;

  @ApiProperty()
  ativo: boolean;

  @ApiProperty()
  createdAt: Date;
}
