import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MesaoTipo } from '@prisma/client';

export class MesaoParticipanteDto {
  @ApiProperty() nick: string;
  @ApiProperty() posicao: number;
}

export class MesaoMinhaInscricaoDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: MesaoTipo }) tipo: MesaoTipo;
  @ApiProperty() posicao: number;
}

export class MesaoSessaoResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ description: 'ISO 8601' }) dataHora: string;
  @ApiPropertyOptional({ nullable: true }) titulo: string | null;
  @ApiPropertyOptional({ nullable: true }) bracket: string | null;
  @ApiProperty() vagasJogador: number;
  @ApiProperty() vagasSuplente: number;
  @ApiProperty() aberta: boolean;
  @ApiPropertyOptional({ nullable: true }) observacoes: string | null;
  @ApiProperty({ type: [MesaoParticipanteDto] }) jogadores: MesaoParticipanteDto[];
  @ApiProperty({ type: [MesaoParticipanteDto] }) suplentes: MesaoParticipanteDto[];
  @ApiPropertyOptional({ type: MesaoMinhaInscricaoDto, nullable: true })
  minhaInscricao: MesaoMinhaInscricaoDto | null;
}

export class MesaoInscricaoAdminDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() nome: string;
  @ApiProperty() nick: string;
  @ApiProperty({ enum: MesaoTipo }) tipo: MesaoTipo;
  @ApiProperty() posicao: number;
  @ApiProperty({ description: 'ISO 8601' }) createdAt: string;
}
