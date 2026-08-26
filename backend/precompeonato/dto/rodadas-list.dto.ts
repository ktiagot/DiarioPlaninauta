import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RodadaListMesaJogadorDto {
  @ApiProperty()
  inscricaoId: string;

  @ApiProperty()
  nick: string;

  @ApiProperty()
  comandante: string;
}

export class RodadaListMesaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  numeroMesa: number;

  @ApiProperty()
  pendente: boolean;

  @ApiProperty({ type: [RodadaListMesaJogadorDto] })
  jogadores: RodadaListMesaJogadorDto[];
}

export class RodadaListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  numero: number;

  @ApiProperty()
  dataRodada: string;

  @ApiProperty({ enum: ['CHECK_IN', 'EM_ANDAMENTO', 'FINALIZADA'] })
  status: 'CHECK_IN' | 'EM_ANDAMENTO' | 'FINALIZADA';

  @ApiProperty()
  totalCheckIns: number;

  @ApiProperty()
  mesasPendentes: number;

  @ApiProperty()
  mesasFinalizadas: number;

  @ApiProperty({ type: [RodadaListMesaDto] })
  mesas: RodadaListMesaDto[];
}

export class AbrirRodadaContextDto {
  @ApiProperty()
  proximoNumero: number;

  @ApiProperty()
  podeAbrirRodada: boolean;

  @ApiPropertyOptional({ nullable: true })
  bloqueioMotivo: string | null;

  @ApiPropertyOptional({ nullable: true })
  rodadaCheckInId: string | null;
}

export class RodadasListResponseDto {
  @ApiProperty({ type: AbrirRodadaContextDto })
  contexto: AbrirRodadaContextDto;

  @ApiProperty({ type: [RodadaListItemDto] })
  rodadas: RodadaListItemDto[];
}
