import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JogadorAdminResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  nick: string;

  @ApiProperty()
  isApoiadorAtivo: boolean;

  @ApiProperty()
  isExApoiador: boolean;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  lastValidationAt: Date | null;

  @ApiPropertyOptional()
  monthlyContribution: number | null;
}
