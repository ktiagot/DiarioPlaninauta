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

  @ApiProperty({ example: 4 })
  quantidadeJogadores: number;

  @ApiPropertyOptional({ example: 'https://twitch.tv/exemplo', nullable: true })
  linkPartida: string | null;

  @ApiProperty({ example: false })
  finalizada: boolean;

  @ApiProperty({ type: [MesaJogadorResponseDto] })
  jogadores: MesaJogadorResponseDto[];

  @ApiProperty({ type: [EliminacaoResponseDto] })
  eliminacoes: EliminacaoResponseDto[];
}
