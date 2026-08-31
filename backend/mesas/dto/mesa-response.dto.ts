import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MesaJogadorResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ example: 'João' })
  nome: string;

  @ApiProperty({ example: 'Silva' })
  sobrenome: string;

  @ApiProperty({ example: 'joaosilva' })
  nick: string;

  @ApiPropertyOptional({ example: 1, nullable: true })
  posicaoFinal: number | null;

  @ApiProperty({ example: 0 })
  kills: number;

  @ApiPropertyOptional({ example: 'Counter Intelligence' })
  deckNome?: string;

  @ApiPropertyOptional({ example: 'Phelia, Exuberant Shepherd' })
  comandante?: string;
}

export class EliminacaoResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  eliminadorUserId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  eliminadoUserId: string;
}

export class MesaResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Mesa 1' })
  nome: string;

  @ApiPropertyOptional({ example: 'Sexta 20h, cEDH', nullable: true })
  descricao: string | null;

  @ApiProperty({ example: '2026-08-29T20:00:00.000Z' })
  dataHora: string;

  @ApiProperty({ example: 4 })
  quantidadeJogadores: number;

  @ApiPropertyOptional({
    example: 'https://twitch.tv/exemplo',
    nullable: true,
    description: 'Visível apenas para o dono e participantes da mesa.',
  })
  linkPartida: string | null;

  @ApiProperty({ example: false, description: 'Se o usuário atual está na mesa (dono ou participante)' })
  souMembro: boolean;

  @ApiProperty({ example: false })
  finalizada: boolean;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', nullable: true })
  criadorUserId: string | null;

  @ApiProperty({ type: [MesaJogadorResponseDto] })
  jogadores: MesaJogadorResponseDto[];

  @ApiProperty({ type: [EliminacaoResponseDto] })
  eliminacoes: EliminacaoResponseDto[];
}
