import { ApiProperty } from '@nestjs/swagger';

export class InscricaoResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  campeonatoId: string;

  @ApiProperty({ example: 'usuario@email.com' })
  email: string;

  @ApiProperty({ example: 'https://moxfield.com/decks/abc123' })
  deckUrl: string;

  @ApiProperty({ example: 'Precon Atraxa' })
  deckNome: string;

  @ApiProperty({ example: 'Atraxa, Praetors\' Voice' })
  comandante: string;

  @ApiProperty({ example: 'João' })
  nome: string;

  @ApiProperty({ example: 'joaosilva' })
  nick: string;
}
