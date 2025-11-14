// src/main.ts (NEW - Replaces the entire file)

import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes'; // Import your new routes file
import { jwtInterceptor } from './app/interceptors/jwt.interceptor'; // Import your new functional interceptor

// Bootstrap the standalone AppComponent
bootstrapApplication(AppComponent, {
  // Configure application-wide providers here
  providers: [
    // 1. Set up routing for the application
    provideRouter(routes),

    // 2. Set up animations (replaces BrowserAnimationsModule)
    provideAnimations(),

    // 3. Set up HttpClient and register your functional interceptor
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),

    // If you have other global services that were in AppModule's providers,
    // you would add them here using `importProvidersFrom` or by providing them directly.
    // For example: importProvidersFrom(MatSnackBarModule)
  ]
}).catch(err => console.error(err));