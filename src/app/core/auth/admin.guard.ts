import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const session = inject(SessionService);

  if (!session.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (!session.isAdmin()) {
    return router.createUrlTree(['/']);
  }

  return true;
};
