import { ApiProperty } from '@nestjs/swagger';

export class GrupoResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Anãos' })
  nome: string;

  @ApiProperty({ example: 1 })
  ordem: number;

  @ApiProperty({ example: 14, description: 'Quantidade de inscritos no grupo.' })
  totalInscritos: number;
}
