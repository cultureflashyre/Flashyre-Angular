import { Injectable, ErrorHandler } from '@angular/core';
import { initializeFaro, getWebInstrumentations, Faro } from '@grafana/faro-web-sdk';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TelemetryService {
  private faro: Faro | null = null;
  private initialized = false;

  constructor() {
    this.initFaro();
  }

  /**
   * Initializes the Grafana Faro Web SDK if enabled in the environment.
   */
  private initFaro(): void {
    if (this.initialized) {
      return;
    }

    const config = (environment as any).grafanaFaro;

    if (!config || !config.enabled || !config.url) {
      // Faro is not enabled or URL is not configured yet. Gracefully silent.
      return;
    }

    try {
      this.faro = initializeFaro({
        url: config.url,
        app: {
          name: config.appName || 'flashyre-angular',
          version: '1.0.0',
          environment: config.environment || (environment.production ? 'production' : 'development'),
        },
        instrumentations: [
          ...getWebInstrumentations({
            captureConsole: true,
          }),
        ],
      });

      this.initialized = true;
      console.info('🚀 [Telemetry] Grafana Faro initialized successfully for', config.appName);
    } catch (err) {
      console.warn('⚠️ [Telemetry] Failed to initialize Grafana Faro:', err);
    }
  }

  /**
   * Captures an unhandled or caught JavaScript exception.
   */
  public captureException(error: any): void {
    if (this.faro) {
      try {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        this.faro.api.pushError(errorObj);
      } catch (e) {
        // Prevent telemetry errors from causing secondary app crashes
      }
    }
  }

  /**
   * Captures a custom telemetry event (e.g. user actions, workflow milestones).
   */
  public logEvent(name: string, attributes?: Record<string, string>): void {
    if (this.faro) {
      try {
        this.faro.api.pushEvent(name, attributes);
      } catch (e) {
        // Prevent telemetry errors
      }
    }
  }

  /**
   * Associates telemetry with an authenticated user (without sending PII).
   */
  public setUser(userId: string, role?: string): void {
    if (this.faro) {
      try {
        this.faro.api.setUser({
          id: userId,
          attributes: role ? { role } : undefined,
        });
      } catch (e) {
        // Prevent telemetry errors
      }
    }
  }

  /**
   * Clears user session context on logout.
   */
  public clearUser(): void {
    if (this.faro) {
      try {
        this.faro.api.resetUser();
      } catch (e) {
        // Prevent telemetry errors
      }
    }
  }
}

/**
 * Global Angular ErrorHandler that automatically forwards runtime errors to Grafana Faro.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private telemetry: TelemetryService) {}

  handleError(error: any): void {
    this.telemetry.captureException(error);
    // Continue outputting error to browser console for developers
    console.error('[GlobalErrorHandler]', error);
  }
}
