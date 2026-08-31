import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Senha atual', example: 'minhasenha123' })
  @IsString()
  senhaAtual: string;

  @ApiProperty({ description: 'Nova senha', example: 'novasenha456', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres.' })
  novaSenha: string;
}
