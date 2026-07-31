import { ApiProperty } from '@nestjs/swagger';

export class ContadorNaoLidasDto {
  @ApiProperty({ description: 'Quantidade de notificações não lidas' })
  count!: number;
}
