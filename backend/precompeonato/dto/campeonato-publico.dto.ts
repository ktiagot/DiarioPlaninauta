import { ApiProperty } from '@nestjs/swagger';

export class CampeonatoPublicoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Precompeonato' })
  nome: string;

  @ApiProperty({ example: '#2' })
  edicao: string;
}
