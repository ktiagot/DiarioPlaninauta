import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResgatarDto {
  @ApiProperty({ example: 'uuid-do-produto' })
  @IsString()
  @IsNotEmpty()
  produtoId: string;
}
