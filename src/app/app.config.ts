import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';

import { registerFontAwesomeIcons } from './core/fontawesome';
import { authInterceptor } from './core/auth/auth.interceptor';
import { TemaService } from './core/tema/tema.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    provideRouter(routes),
    provideAppInitializer(() => {
      registerFontAwesomeIcons(inject(FaIconLibrary));
      // Carrega e aplica o tema global ANTES de renderizar (evita flash de tema
      // padrão). Retorna a Promise para que o bootstrap aguarde; carregarEAplicar
      // já cai no tema padrão em caso de erro.
      return firstValueFrom(inject(TemaService).carregarEAplicar());
    }),
  ],
};
