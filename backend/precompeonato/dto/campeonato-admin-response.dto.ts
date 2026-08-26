import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampeonatoStatus } from '@prisma/client';

export class CampeonatoAdminResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Precompeonato #1' })
  nome: string;

  @ApiProperty({ example: '#1' })
  edicao: string;

  @ApiProperty({ example: '2026-09-01' })
  dataInicio: string;

  @ApiPropertyOptional({ example: 'Temporada 1', nullable: true })
  descricao: string | null;

  @ApiPropertyOptional({
    example: '/uploads/campeonatos/c1.webp',
    nullable: true,
  })
  bannerUrl: string | null;

  @ApiProperty({ example: 'Inscrições abertas' })
  status: string;

  @ApiProperty({
    enum: CampeonatoStatus,
    example: CampeonatoStatus.INSCRICOES_ABERTAS,
  })
  statusCode: CampeonatoStatus;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  createdAt: string;
}
