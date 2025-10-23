// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';

// ⚠️ Si tu ajoutes d'autres intercepteurs plus tard,
// fais: withInterceptors([authInterceptor, otherInterceptor])
export const appConfig: ApplicationConfig = {
  providers: [
    // Router
    provideRouter(routes),

    // HttpClient + Intercepteur qui ajoute "Authorization: Bearer <token>"
    provideHttpClient(
      withInterceptors([authInterceptor]),
    ),
  ],
};
