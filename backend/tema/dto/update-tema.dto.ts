import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

const HEX = /^#([0-9a-fA-F]{6})$/;
const hexMsg = { message: 'Cor deve estar no formato hexadecimal #RRGGBB.' };

export class UpdateTemaDto {
  @ApiProperty({ enum: ['PADRAO', 'PERSONALIZADO'], example: 'PERSONALIZADO' })
  @IsIn(['PADRAO', 'PERSONALIZADO'])
  modo!: 'PADRAO' | 'PERSONALIZADO';

  @ApiPropertyOptional({ example: '#f58220' })
  @IsOptional()
  @IsString()
  @Matches(HEX, hexMsg)
  primary?: string;

  @ApiPropertyOptional({ example: '#ff6b00' })
  @IsOptional()
  @IsString()
  @Matches(HEX, hexMsg)
  primaryStrong?: string;

  @ApiPropertyOptional({ example: '#ffffff' })
  @IsOptional()
  @IsString()
  @Matches(HEX, hexMsg)
  onPrimary?: string;

  @ApiPropertyOptional({ example: '#000000' })
  @IsOptional()
  @IsString()
  @Matches(HEX, hexMsg)
  bg?: string;

  @ApiPropertyOptional({ example: '#ffffff' })
  @IsOptional()
  @IsString()
  @Matches(HEX, hexMsg)
  text?: string;
}
