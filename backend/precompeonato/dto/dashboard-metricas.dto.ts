import { ApiProperty } from '@nestjs/swagger';

export class MetricasGeraisDto {
  @ApiProperty({ example: 42 })
  totalUsuarios: number;

  @ApiProperty({ example: 35 })
  apoiadoresAtivos: number;

  @ApiProperty({ example: 5 })
  exApoiadores: number;

  @ApiProperty({ example: 3 })
  campeonatosRealizados: number;

  @ApiProperty({ example: 12 })
  totalRodadas: number;

  @ApiProperty({ example: 48 })
  totalPartidas: number;

  @ApiProperty({ example: 15 })
  totalMesasCasuais: number;
}

export class EvolucaoRodadaDto {
  @ApiProperty({ example: 'Rodada 1' })
  label: string;

  @ApiProperty({ example: 8 })
  jogadores: number;

  @ApiProperty({ example: 2 })
  mesas: number;
}

export class MetagameDistribuicaoDto {
  @ApiProperty({ example: 'Atraxa' })
  comandante: string;

  @ApiProperty({ example: 5 })
  quantidade: number;
}

export class DashboardMetricasResponseDto {
  @ApiProperty({ type: MetricasGeraisDto })
  gerais: MetricasGeraisDto;

  @ApiProperty({ type: [EvolucaoRodadaDto] })
  evolucaoRodadas: EvolucaoRodadaDto[];

  @ApiProperty({ type: [MetagameDistribuicaoDto] })
  metagameDistribuicao: MetagameDistribuicaoDto[];

  @ApiProperty({ type: [String], example: ['Rodada 1', 'Rodada 2'] })
  topKillsPorRodada: { label: string; kills: number }[];
}
