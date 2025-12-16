import { Component, Input } from '@angular/core'
import { NgClass } from '@angular/common';

@Component({
    selector: 'progress-bar-step3',
    templateUrl: 'progress-bar-step-3.component.html',
    styleUrls: ['progress-bar-step-3.component.css'],
    standalone: true,
    imports: [NgClass],
})
export class ProgressBarStep3 {
  @Input()
  rootClassName: string = ''

    @Input()
  userType: string = 'candidate'; // Default to 'candidate'

  constructor() {}

  get isCandidate(): boolean {
    return this.userType === 'candidate';
  }
}
