import { ApiProperty } from '@nestjs/swagger';

export class PreconComandanteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  comandante: string;

  @ApiProperty()
  ordem: number;
}

export class PreconResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  setNome: string;

  @ApiProperty()
  cores: string;

  @ApiProperty()
  ano: number;

  @ApiProperty()
  banido: boolean;

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
  cores: string;

  @ApiProperty()
  ano: number;
}
