import { Component, Input } from '@angular/core'

@Component({
  selector: 'progress-bar-step4',
  templateUrl: 'progress-bar-step-4.component.html',
  styleUrls: ['progress-bar-step-4.component.css'],
})
export class ProgressBarStep4 {
  @Input()
  rootClassName: string = ''
  constructor() {}
}
