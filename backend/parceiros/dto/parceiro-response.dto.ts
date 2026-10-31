import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ParceiroResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Liga Magic' })
  nome: string;

  @ApiPropertyOptional({ example: 'Loja parceira oficial', nullable: true })
  descricao: string | null;

  @ApiPropertyOptional({ example: '/api/uploads/parceiros/abc.png', nullable: true })
  logoUrl: string | null;

  @ApiProperty({ example: 'https://ligamagic.com.br' })
  url: string;

  @ApiProperty({ example: true })
  ativo: boolean;

  @ApiProperty({ example: 0 })
  ordem: number;

  @ApiProperty({ example: 42, description: 'Total de cliques (visível só no admin).' })
  cliques: number;
}
