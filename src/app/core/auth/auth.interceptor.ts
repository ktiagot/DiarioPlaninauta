import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

import { SessionService } from './session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  const token = session.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      // Token expirado/inválido: encerra a sessão local e manda para o login.
      // Rotas /auth/* podem devolver 401 por credenciais erradas, então ficam de fora.
      if (
        token &&
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        !req.url.includes('/auth/')
      ) {
        session.clear();
        snackBar.open('Sua sessão expirou. Entre novamente.', 'OK', { duration: 6000 });
        void router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
