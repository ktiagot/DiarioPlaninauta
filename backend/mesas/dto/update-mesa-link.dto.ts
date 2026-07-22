import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMesaLinkDto {
  @ApiProperty({ example: 'https://spelltable.wizards.com/game/abc123' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true })
  linkPartida: string;
}
