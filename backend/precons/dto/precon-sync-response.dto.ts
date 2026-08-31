import { ApiProperty } from '@nestjs/swagger';

export class PreconSyncResponseDto {
  @ApiProperty({ example: 12, description: 'Precons criados' })
  criados: number;

  @ApiProperty({ example: 168, description: 'Precons atualizados' })
  atualizados: number;

  @ApiProperty({ example: 180, description: 'Total processado' })
  total: number;
}
