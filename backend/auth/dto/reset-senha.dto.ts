import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ResetSenhaDto {
  @ApiProperty({ description: 'E-mail da conta', example: 'usuario@email.com' })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;

  @ApiProperty({ description: 'Código de 6 dígitos recebido por e-mail', example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'O código deve ter 6 dígitos.' })
  codigo: string;

  @ApiProperty({ description: 'Nova senha', example: 'novasenha456', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres.' })
  novaSenha: string;
}
