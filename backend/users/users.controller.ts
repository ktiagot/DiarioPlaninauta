import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
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
  ApiServiceUnavailableResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';

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
  @ApiCreatedResponse({ description: 'Usuário criado com sucesso.', type: UserResponseDto })
  @ApiConflictResponse({ description: 'E-mail ou nick já cadastrado.' })
  @ApiServiceUnavailableResponse({
    description: 'Serviço de verificação APOIA.se indisponível.',
  })
  create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get('availability')
  @ApiOperation({
    summary: 'Verificar disponibilidade de e-mail e/ou nick',
    description:
      'Consulta se e-mail e/ou nick já estão cadastrados. Informe ao menos um dos query params.',
  })
  @ApiQuery({ name: 'email', required: false, example: 'usuario@email.com' })
  @ApiQuery({ name: 'nick', required: false, example: 'joaosilva' })
  @ApiOkResponse({
    description: 'Status de disponibilidade.',
    type: AvailabilityResponseDto,
  })
  checkAvailability(
    @Query('email') email?: string,
    @Query('nick') nick?: string,
  ): Promise<AvailabilityResponseDto> {
    return this.usersService.checkAvailability(email, nick);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar usuário por ID',
    description: 'Retorna os dados completos de um usuário pelo seu UUID.',
  })
  @ApiOkResponse({ description: 'Usuário encontrado.', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar perfil do usuário',
    description: 'Atualiza parcialmente os dados do perfil de um usuário.',
  })
  @ApiOkResponse({ description: 'Usuário atualizado com sucesso.', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
    return this.usersService.update(id, dto);
  }
}
