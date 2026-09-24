// src/main.ts (NEW - Replaces the entire file)

import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom, ErrorHandler } from '@angular/core'; // Import this
import { MatSnackBarModule } from '@angular/material/snack-bar'; // Import this
import { GlobalErrorHandler } from './app/services/telemetry.service';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes'; // Import your new routes file
import { jwtInterceptor } from './app/interceptors/jwt.interceptor'; // Import your new functional interceptor

import { SocialAuthServiceConfig } from '@abacritt/angularx-social-login';
import { GoogleLoginProvider } from '@abacritt/angularx-social-login';
import { environment } from './environments/environment';

// Bootstrap the standalone AppComponent
bootstrapApplication(AppComponent, {
  // Configure application-wide providers here
  providers: [
    // 1. Set up routing for the application
    provideRouter(routes),

    // 2. Set up animations (replaces BrowserAnimationsModule)
    provideAnimations(),

    // 3. Set up HttpClient with interceptor and CSRF protection
    provideHttpClient(
      withInterceptors([jwtInterceptor]),
      withXsrfConfiguration({
        cookieName: 'csrftoken',
        headerName: 'X-CSRFToken',
      })
    ),

    importProvidersFrom(MatSnackBarModule),

    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false, // Set to true if you want to automatically log in the user on refresh
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              environment.googleClientId // <--- REPLACE WITH YOUR GOOGLE CLIENT ID
            )
          }
          // You can add other providers here, like FacebookLoginProvider
        ],
        onError: (err) => {
          console.error(err);
        }
      } as SocialAuthServiceConfig,
    },

    // 4. Global ErrorHandler for Grafana Faro Observability
    { provide: ErrorHandler, useClass: GlobalErrorHandler },

    // If you have other global services that were in AppModule's providers,
    // you would add them here using `importProvidersFrom` or by providing them directly.
    // For example: importProvidersFrom(MatSnackBarModule)
  ]
}).catch(err => console.error(err));
