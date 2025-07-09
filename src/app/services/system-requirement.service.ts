// proctoring.service.ts
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ProctoringService {
  private visibilityHandler!: () => void;
  private blurHandler!: () => void;

  constructor(private router: Router, private ngZone: NgZone) {}

  startMonitoring() {
    this.setupProctoringListeners();
  }

  private setupProctoringListeners() {
    this.visibilityHandler = () => {
      if (document.hidden) this.handleViolation();
    };

    this.blurHandler = () => {
      this.handleViolation();
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('blur', this.blurHandler);
  }

  private handleViolation() {
    this.ngZone.run(() => {
      this.router.navigate(['/assessment-violation'], {
        state: { message: "Test submitted automatically due to screen/app switching" }
      });
    });
  }

  stopMonitoring() {
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    window.removeEventListener('blur', this.blurHandler);
  }
}