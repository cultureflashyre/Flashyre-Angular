import { Component, Input } from '@angular/core'
import { NgClass } from '@angular/common';

@Component({
    selector: 'progress-bar-step1',
    templateUrl: 'progress-bar-step-1.component.html',
    styleUrls: ['progress-bar-step-1.component.css'],
    standalone: true,
    imports: [NgClass],
})
export class ProgressBarStep1 {
  @Input()
  rootClassName: string = ''

  @Input()
  userType: string = 'candidate'; // Default to 'candidate'

  constructor() {}

  get isCandidate(): boolean {
    return this.userType === 'candidate';
  }
}
