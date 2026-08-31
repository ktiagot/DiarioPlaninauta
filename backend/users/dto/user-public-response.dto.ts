import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserPublicResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'joaosilva' })
  nick: string;

  @ApiProperty({ example: 'João' })
  nome: string;

  @ApiPropertyOptional({ example: 'Silva', nullable: true, description: 'Só quando visibilidade do nome é pública.' })
  sobrenome?: string | null;

  @ApiPropertyOptional({ example: '11999999999', nullable: true, description: 'Só quando visibilidade do telefone é pública.' })
  telefone?: string | null;

  @ApiProperty({ example: 'São Paulo' })
  cidade: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  estado: string | null;

  @ApiProperty({ example: ['Commander'], type: [String] })
  formatos: string[];

  @ApiProperty({ example: ['Segunda', 'Quarta'], type: [String] })
  diasDisponiveis: string[];

  @ApiProperty({ example: ['Noite'], type: [String] })
  horarios: string[];

  @ApiPropertyOptional({ example: 'https://example.com/foto.jpg' })
  foto: string | null;

  @ApiPropertyOptional({ example: 'veteran' })
  badge: string | null;

  @ApiPropertyOptional({ example: '2025-01-15T00:00:00.000Z' })
  apoiandoDesde: Date | null;

  @ApiPropertyOptional({ example: 'Masculino' })
  genero: string | null;

  @ApiPropertyOptional({ example: 'Commander' })
  formatoFavorito: string | null;

  @ApiProperty({ example: [], type: [String] })
  decksMaisUsados: string[];

  @ApiProperty({ example: [], type: [String] })
  preCampeonatos: string[];

  @ApiProperty({ example: [], type: [Number] })
  melhoresResultados: number[];
}
