import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsUrl,
  IsNumber,
  MinLength,
  ArrayNotEmpty,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FORMATOS_DISPONIVEIS } from '../constants/formatos';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateUserDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @Transform(trim)
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'minhasenha123', minLength: 8 })
  @IsString()
  @MinLength(8)
  senha: string;

  @ApiProperty({ example: 'João' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ example: 'Silva' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  sobrenome: string;

  @ApiProperty({ example: 'joaosilva' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  nick: string;

  @ApiProperty({ example: '11999999999' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  telefone: string;

  @ApiProperty({
    example: ['Commander', 'Standard'],
    type: [String],
    enum: FORMATOS_DISPONIVEIS,
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsIn([...FORMATOS_DISPONIVEIS], { each: true })
  formatos: string[];

  @ApiProperty({ example: 'São Paulo' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  cidade: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ example: 'Brasil' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  pais?: string;

  @ApiPropertyOptional({ example: -23.5505 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: -46.6333 })
  @IsOptional()
  @IsNumber()
  lng?: number;

  // --- optional profile fields ---

  @ApiPropertyOptional({ example: 'https://example.com/foto.jpg' })
  @IsOptional()
  @Transform(trim)
  @IsUrl()
  foto?: string;

  @ApiPropertyOptional({ example: 'Masculino' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  genero?: string;

  @ApiPropertyOptional({ example: 'gold' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  tier?: string;

  @ApiPropertyOptional({ example: 'veteran' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  badge?: string;

  @ApiPropertyOptional({ example: 'Commander' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsIn([...FORMATOS_DISPONIVEIS])
  formatoFavorito?: string;

  @ApiPropertyOptional({ example: 'joaosilva#1234' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  discord?: string;

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
