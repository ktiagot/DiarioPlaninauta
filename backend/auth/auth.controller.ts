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
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RequestLoginDto } from './dto/request-login.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto';
import { ResetSenhaDto } from './dto/reset-senha.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthUser } from './strategies/jwt.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-login')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
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
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
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
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
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

  @Post('esqueci-senha')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(200)
  @ApiOperation({
    summary: 'Solicitar redefinição de senha',
    description:
      'Envia um código de 6 dígitos por e-mail (válido por 15 min). A resposta é sempre ' +
      'genérica, independentemente de o e-mail existir ou não.',
  })
  @ApiOkResponse({ description: 'Se o e-mail existir, o código foi enviado.' })
  async esqueciSenha(@Body() dto: EsqueciSenhaDto): Promise<{ success: boolean }> {
    await this.authService.esqueciSenha(dto.email);
    return { success: true };
  }

  @Post('reset-senha')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(200)
  @ApiOperation({
    summary: 'Redefinir senha com código',
    description: 'Valida o código recebido por e-mail e grava a nova senha.',
  })
  @ApiOkResponse({ description: 'Senha redefinida com sucesso.' })
  async resetSenha(@Body() dto: ResetSenhaDto): Promise<{ success: boolean }> {
    await this.authService.resetSenha(dto.email, dto.codigo, dto.novaSenha);
    return { success: true };
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
