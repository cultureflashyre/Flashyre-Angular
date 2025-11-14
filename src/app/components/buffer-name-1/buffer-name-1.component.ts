import { Component } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common';
import { DangerousHtmlComponent } from '../dangerous-html/dangerous-html.component';

@Component({
    selector: 'buffer-name1',
    templateUrl: 'buffer-name-1.component.html',
    styleUrls: ['buffer-name-1.component.css'],
    standalone: true,
    imports: [NgTemplateOutlet, DangerousHtmlComponent,],
})
export class BufferName1 {
  constructor() {}
}
