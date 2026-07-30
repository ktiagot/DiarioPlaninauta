import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampeonatoStatus } from '@prisma/client';

export class InscricaoResumoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'usuario#1234' })
  discordNick: string;

  @ApiPropertyOptional({
    example: 'https://moxfield.com/decks/abc123',
    nullable: true,
  })
  deckUrl: string | null;

  @ApiProperty({ example: 'Precon Atraxa' })
  deckNome: string;

  @ApiProperty({ example: 'Atraxa, Praetors\' Voice' })
  comandante: string;
}

export class CampeonatoAtualResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Precompeonato #1' })
  nome: string;

  @ApiProperty({ example: 'Inscrições abertas' })
  status: string;

  @ApiProperty({
    enum: CampeonatoStatus,
    example: CampeonatoStatus.INSCRICOES_ABERTAS,
  })
  statusCode: CampeonatoStatus;

  @ApiPropertyOptional({
    example: false,
    description: 'Presente quando a query ?email= é informada',
  })
  jaInscrito?: boolean;

  @ApiPropertyOptional({
    type: InscricaoResumoDto,
    nullable: true,
    description: 'Resumo da inscrição do email informado, se existir',
  })
  inscricao?: InscricaoResumoDto | null;
}
