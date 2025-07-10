import { Component, Input } from '@angular/core'

@Component({
  selector: 'progress-bar-step5',
  templateUrl: 'progress-bar-step-5.component.html',
  styleUrls: ['progress-bar-step-5.component.css'],
})
export class ProgressBarStep5 {
  @Input()
  rootClassName: string = ''
  constructor() {}
}