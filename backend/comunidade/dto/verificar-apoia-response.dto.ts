import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerificarApoiaResponseDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  ativo: boolean;

  @ApiProperty()
  isBacker: boolean;

  @ApiProperty()
  isPaidThisMonth: boolean;

  @ApiPropertyOptional()
  thisMonthPaidValue: number | null;

  @ApiProperty()
  apiIndisponivel: boolean;
}
