import { ApiProperty } from '@nestjs/swagger';

export class PreconComandanteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  comandante: string;

  @ApiProperty()
  ordem: number;

  @ApiProperty({ example: 'UG', description: 'Color identity WUBRG; vazio = incolor' })
  colorIdentity: string;

  @ApiProperty({ example: false, description: 'Tem a mecânica Partner' })
  isPartner: boolean;

  @ApiProperty({ example: true, description: 'Comandante principal do precon' })
  isPrincipal: boolean;
}

export class PreconResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  setNome: string;

  @ApiProperty()
  ano: number;

  @ApiProperty()
  banido: boolean;

  @ApiProperty({ example: false, description: 'Deck de partners (permite 2 comandantes)' })
  isPartnerDeck: boolean;

  @ApiProperty({ type: [PreconComandanteResponseDto] })
  comandantes: PreconComandanteResponseDto[];
}

export class PreconListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  setNome: string;

  @ApiProperty()
  ano: number;
}
