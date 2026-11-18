import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnaliseInscritoPublicoDto {
  @ApiProperty() nick: string;
  @ApiProperty() commander: string;
  @ApiProperty() posicao: number;
  @ApiProperty() listaEspera: boolean;
}

export class AnaliseMinhaInscricaoDto {
  @ApiProperty() id: string;
  @ApiProperty() commander: string;
  @ApiProperty() linkDeck: string;
  @ApiPropertyOptional({ nullable: true }) bracket: string | null;
  @ApiProperty() budget: string;
  @ApiProperty() objetivos: string;
  @ApiProperty() posicao: number;
  @ApiProperty() listaEspera: boolean;
}

export class AnaliseSessaoResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ description: 'ISO 8601' }) dataHora: string;
  @ApiPropertyOptional({ nullable: true }) titulo: string | null;
  @ApiProperty() vagas: number;
  @ApiProperty() aberta: boolean;
  @ApiPropertyOptional({ nullable: true }) observacoes: string | null;
  @ApiProperty() confirmados: number;
  @ApiProperty() totalListaEspera: number;
  @ApiPropertyOptional({ type: AnaliseMinhaInscricaoDto, nullable: true })
  minhaInscricao: AnaliseMinhaInscricaoDto | null;
  @ApiProperty({ type: [AnaliseInscritoPublicoDto] })
  inscritos: AnaliseInscritoPublicoDto[];
}

export class AnaliseInscricaoAdminDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() nome: string;
  @ApiProperty() nick: string;
  @ApiProperty() commander: string;
  @ApiProperty() linkDeck: string;
  @ApiPropertyOptional({ nullable: true }) bracket: string | null;
  @ApiProperty() budget: string;
  @ApiProperty() objetivos: string;
  @ApiProperty() posicao: number;
  @ApiProperty() listaEspera: boolean;
  @ApiProperty({ description: 'ISO 8601' }) createdAt: string;
}
