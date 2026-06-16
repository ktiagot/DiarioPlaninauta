import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RequestLoginDto } from './dto/request-login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login via APOIA.se',
    description:
      'Verifica se o e-mail é apoiador ativo e em dia no APOIA.se. Retorna o accessToken direto.',
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

  @Post('verify-backer')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Verificar apoiador no APOIA.se',
    description: 'Consulta se o e-mail pertence a um apoiador ativo no APOIA.se.',
  })
  @ApiOkResponse({
    description: 'Status de apoiador retornado',
    schema: {
      example: { isBacker: true, isPaidThisMonth: true },
    },
  })
  verifyBacker(@Body() dto: RequestLoginDto) {
    return this.authService.verifyBacker(dto.email);
  }
}
