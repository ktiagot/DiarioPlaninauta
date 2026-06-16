import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestLoginDto {
  @ApiProperty({
    example: 'apoiador@email.com',
    description: 'E-mail cadastrado no APOIA.se',
  })
  @IsEmail()
  email: string;
}
