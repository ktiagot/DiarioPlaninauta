import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class EsqueciSenhaDto {
  @ApiProperty({ description: 'E-mail da conta', example: 'usuario@email.com' })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;
}
