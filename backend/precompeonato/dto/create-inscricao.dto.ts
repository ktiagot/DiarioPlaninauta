import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateInscricaoDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @Transform(trim)
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'https://moxfield.com/decks/abc123' })
  @Transform(trim)
  @IsUrl({ require_protocol: true }, { message: 'deckUrl deve ser uma URL válida com http/https' })
  deckUrl: string;

  @ApiProperty({ example: 'Atraxa, Praetors\' Voice' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  comandante: string;

  @ApiProperty({
    example: true,
    description: 'Deve ser true para aceitar os termos de uso',
  })
  @IsBoolean()
  aceiteTermos: boolean;

  @ApiPropertyOptional({ example: 'Precon Atraxa' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  deckNome?: string;
}
