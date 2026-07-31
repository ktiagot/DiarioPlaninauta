import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  BACKER = 'BACKER',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP',
}

export class UserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'usuario@email.com' })
  email: string;

  @ApiProperty({ example: 'João' })
  nome: string;

  @ApiProperty({ example: 'Silva' })
  sobrenome: string;

  @ApiProperty({ example: 'joaosilva' })
  nick: string;

  @ApiProperty({ example: '11999999999' })
  telefone: string;

  @ApiProperty({ example: ['Commander'], type: [String] })
  formatos: string[];

  @ApiProperty({ example: 'São Paulo' })
  cidade: string;

  @ApiProperty({ example: false })
  isAdmin: boolean;

  @ApiProperty({ example: false })
  isExApoiador: boolean;

  @ApiProperty({ example: true })
  isApoiadorAtivo: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/foto.jpg' })
  foto: string | null;

  @ApiPropertyOptional({ example: 'Masculino' })
  genero: string | null;

  @ApiPropertyOptional({ example: 'gold' })
  tier: string | null;

  @ApiPropertyOptional({ example: 'veteran' })
  badge: string | null;

  @ApiPropertyOptional({ example: 'Commander' })
  formatoFavorito: string | null;

  @ApiProperty({ example: [], type: [String] })
  diasDisponiveis: string[];

  @ApiProperty({ example: [], type: [String] })
  horarios: string[];

  @ApiPropertyOptional({ example: 0 })
  partidas: number | null;

  @ApiPropertyOptional({ example: 0 })
  vitorias: number | null;

  @ApiPropertyOptional({ example: 0 })
  eliminacoes: number | null;

  @ApiPropertyOptional({ example: 0 })
  winRate: number | null;

  @ApiPropertyOptional({ example: 0 })
  pontosTotais: number | null;

  @ApiProperty({ example: [], type: [Number] })
  melhoresResultados: number[];

  @ApiProperty({ example: [], type: [String] })
  preCampeonatos: string[];

  @ApiProperty({ example: [], type: [String] })
  decksMaisUsados: string[];

  @ApiProperty({ enum: UserRole, example: UserRole.BACKER })
  role: UserRole;

  @ApiPropertyOptional({ example: 1500 })
  monthlyContribution: number | null;

  @ApiPropertyOptional({ example: '2026-06-30T12:00:00.000Z' })
  lastValidationAt: Date | null;

  @ApiPropertyOptional({ example: '2025-01-15T00:00:00.000Z' })
  apoiandoDesde: Date | null;

  @ApiProperty({ example: '2026-06-30T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-30T12:00:00.000Z' })
  updatedAt: Date;
}
