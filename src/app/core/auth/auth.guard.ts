import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  if (!token) {
    // Visitante deslogado vai para a página de apresentação (Landing),
    // que traz os botões de login/cadastro/apoiar.
    return router.createUrlTree(['/landing']);
  }

  return true;
};
