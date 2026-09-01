import { ApiProperty } from '@nestjs/swagger';

export class NotificacaoResponseDto {
  @ApiProperty({ description: 'ID da notificação' })
  id!: string;

  @ApiProperty({ description: 'Tipo da notificação', example: 'rodada_nova' })
  tipo!: string;

  @ApiProperty({ description: 'Título da notificação' })
  titulo!: string;

  @ApiProperty({ description: 'Mensagem da notificação' })
  mensagem!: string;

  @ApiProperty({ description: 'Se foi lida' })
  lida!: boolean;

  @ApiProperty({ description: 'Tipo do recurso referenciado (ex.: convite_mesa)', nullable: true })
  referenciaTipo!: string | null;

  @ApiProperty({ description: 'ID do recurso referenciado (ex.: id do convite)', nullable: true })
  referenciaId!: string | null;

  @ApiProperty({ description: 'Data de criação' })
  createdAt!: Date;
}
