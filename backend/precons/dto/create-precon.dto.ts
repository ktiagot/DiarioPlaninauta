import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePreconDto {
  @ApiProperty({ example: 'Counter Intelligence' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ example: 'Tarkir: Dragonstorm' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  setNome: string;

  @ApiProperty({ example: 2025 })
  @IsInt()
  @Min(1993)
  ano: number;

  @ApiProperty({
    example: ['Phelia, Exuberant Shepherd', 'Aminatou, the Fateshifter'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((v) => (typeof v === 'string' ? v.trim() : v)) : value,
  )
  comandantes: string[];
}

export class UpdatePreconDto {
  @ApiPropertyOptional({ example: 'Counter Intelligence' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nome?: string;

  @ApiPropertyOptional({ example: 'Tarkir: Dragonstorm' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  setNome?: string;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @IsInt()
  @Min(1993)
  ano?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  banido?: boolean;

  @ApiPropertyOptional({
    example: ['Phelia, Exuberant Shepherd', 'Aminatou, the Fateshifter'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((v) => (typeof v === 'string' ? v.trim() : v)) : value,
  )
  comandantes?: string[];
}
