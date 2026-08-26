import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';

export class AdminCheckInDto {
  @ApiProperty()
  @IsUUID('all')
  inscricaoId: string;

  @ApiProperty({ description: 'true = marcar check-in, false = remover' })
  @IsBoolean()
  checkIn: boolean;
}
