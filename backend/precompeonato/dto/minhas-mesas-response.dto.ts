import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MinhasMesasJogadorDto {
  @ApiProperty({ example: 'joaosilva' })
  nick: string;

  @ApiProperty({ example: 'Atraxa' })
  deckNome: string;

  @ApiPropertyOptional({ nullable: true, example: 1 })
  posicaoFinal: number | null;
}

export class MinhasMesaDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 1 })
  rodadaNumero: number;

  @ApiProperty({ example: 2 })
  numeroMesa: number;

  @ApiProperty({ example: true })
  finalizada: boolean;

  @ApiPropertyOptional({ nullable: true, example: 1 })
  minhaPosicaoFinal: number | null;

  @ApiProperty({ type: [MinhasMesasJogadorDto] })
  jogadores: MinhasMesasJogadorDto[];
}

export class MinhasMesasResponseDto {
  @ApiProperty({ type: [MinhasMesaDto] })
  mesas: MinhasMesaDto[];
}
