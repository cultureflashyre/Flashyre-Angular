import { Component, Input } from '@angular/core'

@Component({
  selector: 'progress-bar-step2',
  templateUrl: 'progress-bar-step-2.component.html',
  styleUrls: ['progress-bar-step-2.component.css'],
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
