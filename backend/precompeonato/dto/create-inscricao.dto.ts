import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ example: 'Precon Atraxa' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  deckNome: string;

  @ApiProperty({ example: 'Atraxa, Praetors\' Voice' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  comandante: string;

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
