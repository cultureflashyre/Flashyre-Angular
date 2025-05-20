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
    console.log('[ProctoringService] startMonitoring called');
    this.setupProctoringListeners();
  }

  stopMonitoring() {
    console.log('[ProctoringService] stopMonitoring called');
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    window.removeEventListener('blur', this.blurHandler);
  }


  private setupProctoringListeners() {
    this.visibilityHandler = () => {
      console.log('[ProctoringService] visibilitychange event:', document.hidden);
      if (document.hidden) this.handleViolation();
    };

    this.blurHandler = () => {
      console.log('[ProctoringService] blur event triggered');
      this.handleViolation();
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('blur', this.blurHandler);
  }

  private handleViolation() {
    console.log('[ProctoringService] handleViolation called');
    this.ngZone.run(() => {
      this.router.navigate(['/assessment-violation-message'], {
        state: { message: "Test submitted automatically due to screen/app switching" }
      });
    });
  }



}
