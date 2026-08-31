import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateInscricaoDto {
  @ApiProperty({ example: 'usuario#1234' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  discordNick: string;

  @ApiProperty({ example: 'usuario@email.com' })
  @Transform(trim)
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'p0000001-0000-4000-8000-000000000001' })
  @IsUUID()
  preconId: string;

  @ApiProperty({ example: 'c0000001-0000-4000-8000-000000000001' })
  @IsUUID()
  preconComandanteId: string;

  @ApiPropertyOptional({
    example: 'c0000001-0000-4000-8000-000000000002',
    description: 'Segundo comandante (apenas para decks de partner)',
  })
  @IsOptional()
  @IsUUID()
  preconComandante2Id?: string;

  @ApiProperty({
    example: true,
    description: 'Deve ser true para aceitar as regras do precompeonato',
  })
  @IsBoolean()
  aceiteTermos: boolean;

  @ApiProperty({
    example: true,
    description: 'Deve ser true para aceitar a política de privacidade',
  })
  @IsBoolean()
  aceitePrivacidade: boolean;

  @ApiProperty({
    example: true,
    description: 'Deve ser true confirmando entrada no Discord do Diário Planinauta',
  })
  @IsBoolean()
  entrouDiscord: boolean;
}
