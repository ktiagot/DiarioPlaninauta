import { ApiProperty } from '@nestjs/swagger';

export class SaldoResponseDto {
  @ApiProperty({ example: 350 })
  saldo: number;
}
