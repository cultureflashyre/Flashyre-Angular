import { Component, Input } from '@angular/core'
import { NgClass } from '@angular/common';

@Component({
    selector: 'progress-bar-step4',
    templateUrl: 'progress-bar-step-4.component.html',
    styleUrls: ['progress-bar-step-4.component.css'],
    standalone: true,
    imports: [NgClass],
})
export class ProgressBarStep4 {
  @Input()
  rootClassName: string = ''

    @Input()
  userType: string = 'candidate'; // Default to 'candidate'

  constructor() {}

  get isCandidate(): boolean {
    return this.userType === 'candidate';
  }
}