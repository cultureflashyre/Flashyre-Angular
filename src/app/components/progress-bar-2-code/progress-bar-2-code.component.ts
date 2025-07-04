import { Component, Input } from '@angular/core'

@Component({
  selector: 'progress-bar2-code',
  templateUrl: 'progress-bar-2-code.component.html',
  styleUrls: ['progress-bar-2-code.component.css'],
})
export class ProgressBar2Code {
  @Input()
  rootClassName: string = ''
  constructor() {}
}
