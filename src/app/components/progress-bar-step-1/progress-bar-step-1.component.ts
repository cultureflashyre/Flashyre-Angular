import { Component, Input } from '@angular/core'

@Component({
  selector: 'progress-bar-step1',
  templateUrl: 'progress-bar-step-1.component.html',
  styleUrls: ['progress-bar-step-1.component.css'],
})
export class ProgressBarStep1 {
  @Input()
  rootClassName: string = ''
  constructor() {}
}
