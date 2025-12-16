import { Component, Input } from '@angular/core'
import { NgClass } from '@angular/common';

@Component({
    selector: 'progress-bar-step2',
    templateUrl: 'progress-bar-step-2.component.html',
    styleUrls: ['progress-bar-step-2.component.css'],
    standalone: true,
    imports: [NgClass],
})
export class ProgressBarStep2 {
  @Input()
  rootClassName: string = ''
  constructor() {}

    @Input()
  userType: string = 'candidate'; // Default to 'candidate'

    get isCandidate(): boolean {
    return this.userType === 'candidate';
  }
}
