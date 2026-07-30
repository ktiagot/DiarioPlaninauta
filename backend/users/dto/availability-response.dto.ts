import { ApiProperty } from '@nestjs/swagger';

export class AvailabilityResponseDto {
  @ApiProperty({
    nullable: true,
    description: 'true se o e-mail já está em uso; null se não foi consultado',
    example: false,
  })
  emailTaken: boolean | null;

  @ApiProperty({
    nullable: true,
    description: 'true se o nick já está em uso; null se não foi consultado',
    example: false,
  })
  nickTaken: boolean | null;
}
