import { ApiProperty } from '@nestjs/swagger';

export class TemaResponseDto {
  @ApiProperty({ enum: ['PADRAO', 'PERSONALIZADO'], example: 'PADRAO' })
  modo!: 'PADRAO' | 'PERSONALIZADO';

  @ApiProperty({ example: '#f58220' })
  primary!: string;

  @ApiProperty({ example: '#ff6b00' })
  primaryStrong!: string;

  @ApiProperty({ example: '#ffffff' })
  onPrimary!: string;

  @ApiProperty({ example: '#000000' })
  bg!: string;

  @ApiProperty({ example: '#ffffff' })
  text!: string;
}
