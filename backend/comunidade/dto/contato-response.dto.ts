import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContatoResponseDto {
  @ApiProperty({ description: 'Se o favorito é mútuo (ambos se favoritaram)' })
  mutuo: boolean;

  @ApiPropertyOptional({ description: 'Telefone/WhatsApp (só se mútuo)' })
  telefone?: string;

  @ApiPropertyOptional({ description: 'Discord (se disponível e mútuo)' })
  discord?: string;
}
