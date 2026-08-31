import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMesaLinkDto {
  @ApiProperty({ example: 'spelltable.wizards.com/game/abc123' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: false })
  linkPartida: string;
}
