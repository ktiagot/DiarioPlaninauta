import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SorteioJogadorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nomeJogador: string;

  @ApiProperty()
  nick: string;

  @ApiProperty()
  discordNick: string;

  @ApiProperty()
  deckNome: string;

  @ApiProperty()
  comandante: string;

  @ApiPropertyOptional({ nullable: true })
  deckUrl: string | null;

  @ApiProperty()
  pontos: number;

  @ApiPropertyOptional({ nullable: true })
  posicao: number | null;

  @ApiProperty()
  eliminacoes: number;

  @ApiProperty()
  checkIn: boolean;
}

export class SorteioMesaJogadorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nomeJogador: string;

  @ApiProperty()
  nick: string;

  @ApiProperty()
  discordNick: string;

  @ApiProperty()
  deckNome: string;

  @ApiProperty()
  comandante: string;

  @ApiProperty()
  pontos: number;
}

export class SorteioMesaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  numeroMesa: number;

  @ApiProperty({ type: [SorteioMesaJogadorDto] })
  jogadores: SorteioMesaJogadorDto[];
}

export class SorteioSnapshotDto {
  @ApiProperty()
  campeonatoId: string;

  @ApiProperty()
  campeonatoNome: string;

  @ApiPropertyOptional({ nullable: true })
  rodadaId: string | null;

  @ApiPropertyOptional({ nullable: true })
  rodadaNumero: number | null;

  @ApiPropertyOptional({ nullable: true })
  dataRodada: string | null;

  @ApiProperty()
  jaSorteada: boolean;

  @ApiProperty()
  totalCheckIns: number;

  @ApiProperty()
  podeSortear: boolean;

  @ApiProperty()
  podeReSortear: boolean;

  @ApiProperty({ type: [SorteioJogadorDto] })
  jogadores: SorteioJogadorDto[];

  @ApiProperty({ type: [SorteioMesaDto] })
  mesas: SorteioMesaDto[];
}

export class CheckInStatusDto {
  @ApiPropertyOptional({ nullable: true })
  rodadaId: string | null;

  @ApiPropertyOptional({ nullable: true })
  rodadaNumero: number | null;

  @ApiProperty()
  checkIn: boolean;

  @ApiProperty()
  jaInscrito: boolean;

  @ApiProperty()
  podeCheckIn: boolean;
}
