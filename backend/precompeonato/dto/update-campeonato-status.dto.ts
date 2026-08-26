import { ApiProperty } from '@nestjs/swagger';
import { CampeonatoStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateCampeonatoStatusDto {
  @ApiProperty({ enum: CampeonatoStatus })
  @IsEnum(CampeonatoStatus)
  status: CampeonatoStatus;
}
