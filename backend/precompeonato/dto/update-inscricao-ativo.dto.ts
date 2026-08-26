import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateInscricaoAtivoDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  ativo: boolean;
}
