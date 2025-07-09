// proctoring.service.ts
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'  // This service is provided application-wide (singleton)
})
export class ProctoringService {
  // Handlers for event listeners, stored so they can be removed later
  private visibilityHandler!: () => void;
  private blurHandler!: () => void;

  // Inject Angular Router for navigation and NgZone for running code inside Angular zone
  constructor(private router: Router, private ngZone: NgZone) {}

  // Public method to start monitoring user activity for proctoring
  startMonitoring() {
    this.setupProctoringListeners();  // Set up event listeners for visibility and focus changes
  }

  // Private method to attach event listeners related to proctoring violations
  private setupProctoringListeners() {
    // Handler for visibility change event (when user switches tabs or minimizes window)
    this.visibilityHandler = () => {
      // Check if the document is hidden (user switched tab or minimized)
      if (document.hidden) {
        console.log('Document hidden detected - handling violation');
        this.handleViolation();  // Trigger violation handling
      }
    };

    // Handler for window blur event (when window loses focus)
    this.blurHandler = () => {
      console.log('Window blur detected - handling violation');
      this.handleViolation();  // Trigger violation handling
    };

    // Attach the visibility change listener to the document
    document.addEventListener('visibilitychange', this.visibilityHandler);

    // Attach the blur event listener to the window
    window.addEventListener('blur', this.blurHandler);

    console.log('Proctoring listeners attached');
  }

  // Private method to handle detected violations
  private handleViolation() {
    // Use NgZone.run to ensure navigation happens inside Angular's zone,
    // so change detection works properly
    this.ngZone.run(() => {
      console.log('Navigating to /assessment-violation-message due to violation');
      this.router.navigate(['/assessment-violation-message'], {
        state: { message: "Test submitted automatically due to screen/app switching" }
      });
    });
  }

  // Public method to stop monitoring and remove event listeners
  stopMonitoring() {
    // Remove previously attached event listeners to prevent memory leaks
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    window.removeEventListener('blur', this.blurHandler);

    console.log('Proctoring listeners removed');
  }
}
