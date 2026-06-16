import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUrl,
  IsInt,
  Min,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'João' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ example: 'Silva' })
  @IsString()
  @IsNotEmpty()
  sobrenome: string;

  @ApiProperty({ example: 'joaosilva' })
  @IsString()
  @IsNotEmpty()
  nick: string;

  @ApiProperty({ example: '11999999999' })
  @IsString()
  @IsNotEmpty()
  telefone: string;

  @ApiProperty({ example: ['Commander', 'Standard'], type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  formatos: string[];

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  cidade: string;

  // --- optional profile fields ---

  @ApiPropertyOptional({ example: 'https://example.com/foto.jpg' })
  @IsOptional()
  @IsUrl()
  foto?: string;

  @ApiPropertyOptional({ example: 'Masculino' })
  @IsOptional()
  @IsString()
  genero?: string;

  @ApiPropertyOptional({ example: 'gold' })
  @IsOptional()
  @IsString()
  tier?: string;

  @ApiPropertyOptional({ example: 'veteran' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({ example: 'Commander' })
  @IsOptional()
  @IsString()
  formatoFavorito?: string;

  @ApiPropertyOptional({ example: ['sábado', 'domingo'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diasDisponiveis?: string[];

  @ApiPropertyOptional({ example: ['08:00-12:00', '14:00-18:00'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  horarios?: string[];

  @ApiPropertyOptional({ example: ['Deck1', 'Deck2'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  decksMaisUsados?: string[];

  @ApiPropertyOptional({ example: ['GP São Paulo 2025', 'RCQ Regional'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preCampeonatos?: string[];
}
