import { Component, Input } from '@angular/core'

@Component({
  selector: 'progress-bar-step3',
  templateUrl: 'progress-bar-step-3.component.html',
  styleUrls: ['progress-bar-step-3.component.css'],
})
export class ProgressBarStep3 {
  @Input()
  rootClassName: string = ''
  constructor() {}
}
