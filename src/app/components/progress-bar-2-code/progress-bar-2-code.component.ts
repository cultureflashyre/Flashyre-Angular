import { Component, Input } from '@angular/core'
import { NgClass } from '@angular/common';

@Component({
    selector: 'progress-bar2-code',
    templateUrl: 'progress-bar-2-code.component.html',
    styleUrls: ['progress-bar-2-code.component.css'],
    standalone: true,
    imports: [NgClass],
})
export class ProgressBar2Code {
  @Input()
  rootClassName: string = ''
  constructor() {}
}