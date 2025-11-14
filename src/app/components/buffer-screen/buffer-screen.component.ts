import { Component, Input } from '@angular/core'
import { NgClass } from '@angular/common';

@Component({
    selector: 'buffer-screen',
    templateUrl: 'buffer-screen.component.html',
    styleUrls: ['buffer-screen.component.css'],
    standalone: true,
    imports: [NgClass],
})
export class BufferScreen {
  @Input()
  rootClassName: string = ''
  constructor() {}
}
