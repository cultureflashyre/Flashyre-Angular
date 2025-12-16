import { Component, Input } from '@angular/core'
import { NgClass } from '@angular/common';
import { DangerousHtmlComponent } from '../dangerous-html/dangerous-html.component';

@Component({
    selector: 'buffer-screen',
    templateUrl: 'buffer-screen.component.html',
    styleUrls: ['buffer-screen.component.css'],
    standalone: true,
    imports: [NgClass, DangerousHtmlComponent,],
})
export class BufferScreen {
  @Input()
  rootClassName: string = ''
  constructor() {}
}
