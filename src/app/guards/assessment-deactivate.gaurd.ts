import { CanDeactivate } from '@angular/router';
import { Injectable } from '@angular/core';
import { FlashyreAssessment11 } from '../pages/flashyre-assessment11/flashyre-assessment11.component';

@Injectable({ providedIn: 'root' })
export class AssessmentDeactivateGuard implements CanDeactivate<FlashyreAssessment11> {
  canDeactivate(component: FlashyreAssessment11): Promise<boolean> | boolean {
    return component.terminateTest().then(() => true).catch(() => false);
  }
}
