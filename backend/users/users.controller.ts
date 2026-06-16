import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastrar usuário',
    description: 'Cria um novo usuário com todos os dados obrigatórios de perfil.',
  })
  @ApiCreatedResponse({ description: 'Usuário criado com sucesso.' })
  @ApiConflictResponse({ description: 'E-mail já cadastrado.' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar usuário por ID',
    description: 'Retorna os dados completos de um usuário pelo seu UUID.',
  })
  @ApiOkResponse({ description: 'Usuário encontrado.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar perfil do usuário',
    description: 'Atualiza parcialmente os dados do perfil de um usuário.',
  })
  @ApiOkResponse({ description: 'Usuário atualizado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
