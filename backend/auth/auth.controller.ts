import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RequestLoginDto } from './dto/request-login.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthUser } from './strategies/jwt.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login via APOIA.se',
    description:
      'Verifica se o e-mail é apoiador ativo e em dia no APOIA.se. Exige conta já cadastrada via POST /users; não cria usuários. Retorna o accessToken.',
  })
  @ApiOkResponse({
    description: 'Login realizado com sucesso',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: { id: 'uuid', email: 'usuario@email.com', role: 'BACKER', monthlyContribution: 15 },
      },
    },
  })
  requestLogin(@Body() dto: RequestLoginDto) {
    return this.authService.requestLogin(dto.email);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login com e-mail e senha',
    description: 'Autentica o usuário com e-mail e senha. Retorna o accessToken.',
  })
  @ApiOkResponse({
    description: 'Login realizado com sucesso',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: { id: 'uuid', email: 'usuario@email.com', role: 'BACKER', monthlyContribution: 15 },
      },
    },
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('verify-backer')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Verificar apoiador no APOIA.se',
    description: 'Consulta se o e-mail pertence a um apoiador ativo no APOIA.se.',
  })
  @ApiOkResponse({
    description: 'Status de apoiador retornado',
    schema: {
      example: { isBacker: true, isPaidThisMonth: true, thisMonthPaidValue: 15 },
    },
  })
  verifyBacker(@Body() dto: RequestLoginDto) {
    return this.authService.verifyBacker(dto.email);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Alterar a própria senha',
    description: 'Valida a senha atual e grava a nova senha para o usuário autenticado.',
  })
  @ApiOkResponse({ description: 'Senha alterada com sucesso.' })
  @ApiUnauthorizedResponse({ description: 'Senha atual incorreta.' })
  async changePassword(
    @Request() req: { user: AuthUser },
    @Body() dto: ChangePasswordDto,
  ): Promise<{ success: boolean }> {
    await this.authService.changePassword(req.user.id, dto.senhaAtual, dto.novaSenha);
    return { success: true };
  }
}
