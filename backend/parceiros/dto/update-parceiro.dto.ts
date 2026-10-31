import { PartialType } from '@nestjs/swagger';
import { CreateParceiroDto } from './create-parceiro.dto';

export class UpdateParceiroDto extends PartialType(CreateParceiroDto) {}
