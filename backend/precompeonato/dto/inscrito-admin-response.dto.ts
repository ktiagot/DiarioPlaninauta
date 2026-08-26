import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InscritoAdminResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'João' })
  nome: string;

  @ApiProperty({ example: 'joaosilva' })
  nick: string;

  @ApiProperty({ example: 'usuario@email.com' })
  email: string;

  @ApiPropertyOptional({
    example: 'https://moxfield.com/decks/abc123',
    nullable: true,
  })
  deckUrl: string | null;

  @ApiProperty({ example: 'Precon Atraxa' })
  deckNome: string;

  @ApiProperty({ example: "Atraxa, Praetors' Voice" })
  comandante: string;

  @ApiProperty({ example: 6 })
  pontos: number;

  @ApiProperty({ example: 2 })
  vitorias: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  posicao: number | null;

  @ApiProperty({ example: true })
  ativo: boolean;
}
