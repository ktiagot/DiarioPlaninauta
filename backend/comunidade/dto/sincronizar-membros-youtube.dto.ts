import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class SincronizarMembrosYoutubeDto {
  @ApiProperty({
    description:
      'Lista COMPLETA de e-mails dos membros atuais do YouTube (extraída do CSV). ' +
      'A sincronização é total: quem não estiver na lista deixa de ser membro.',
    example: ['membro1@email.com', 'membro2@email.com'],
    type: [String],
  })
  @IsArray()
  @ArrayMaxSize(10000)
  @IsString({ each: true })
  emails: string[];
}

export class SincronizarMembrosYoutubeResponseDto {
  @ApiProperty({ example: 120, description: 'E-mails válidos recebidos (deduplicados).' })
  recebidos: number;

  @ApiProperty({ example: 98, description: 'Usuários marcados como membros ativos.' })
  marcadosMembro: number;

  @ApiProperty({ example: 5, description: 'Usuários que deixaram de ser membros.' })
  removidosMembro: number;

  @ApiProperty({
    example: 22,
    description: 'E-mails do CSV sem usuário cadastrado no portal (ignorados).',
  })
  semCadastro: number;
}
