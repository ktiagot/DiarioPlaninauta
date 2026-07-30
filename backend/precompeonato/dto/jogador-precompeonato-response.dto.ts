import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JogadorPrecompeonatoResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiPropertyOptional({
    example: 'https://moxfield.com/decks/abc123',
    nullable: true,
  })
  deckUrl: string | null;

  @ApiProperty({ example: 'Precon Atraxa' })
  deckNome: string;

  @ApiProperty({ example: 'Atraxa, Praetors\' Voice' })
  comandante: string;

  @ApiProperty({ example: 'João' })
  nomeJogador: string;

  @ApiProperty({ example: 'joaosilva' })
  nick: string;

  @ApiProperty({ example: 'usuario#1234' })
  discordNick: string;

  @ApiPropertyOptional({ example: 1, nullable: true })
  posicao: number | null;

  @ApiPropertyOptional({ example: 2, nullable: true })
  rodadaAtual: number | null;

  @ApiPropertyOptional({ example: 3, nullable: true })
  mesaAtual: number | null;

  @ApiProperty({ example: 6 })
  pontos: number;
}
