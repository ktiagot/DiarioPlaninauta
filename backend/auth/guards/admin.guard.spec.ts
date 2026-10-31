import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

function contextComUser(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('libera quando o usuário é admin', () => {
    expect(guard.canActivate(contextComUser({ id: 'u1', isAdmin: true }))).toBe(true);
  });

  it('401 quando não há usuário autenticado', () => {
    expect(() => guard.canActivate(contextComUser(undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it('403 quando o usuário não é admin', () => {
    expect(() => guard.canActivate(contextComUser({ id: 'u1', isAdmin: false }))).toThrow(
      ForbiddenException,
    );
  });
});
