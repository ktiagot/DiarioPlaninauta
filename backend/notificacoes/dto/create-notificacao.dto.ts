import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNotificacaoDto {
  @ApiProperty({ description: 'ID do usuário destinatário' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Tipo da notificação',
    example: 'rodada_nova',
    enum: ['rodada_nova', 'resultado_publicado', 'favorito_mutuo', 'pontos_creditados', 'geral'],
  })
  @IsString()
  @IsNotEmpty()
  tipo!: string;

  @ApiProperty({ description: 'Título da notificação' })
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @ApiProperty({ description: 'Mensagem da notificação' })
  @IsString()
  @IsNotEmpty()
  mensagem!: string;
}
