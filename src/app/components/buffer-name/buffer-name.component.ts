import { Component, Input } from '@angular/core'
import { NgClass } from '@angular/common';

@Component({
    selector: 'buffer-name',
    templateUrl: 'buffer-name.component.html',
    styleUrls: ['buffer-name.component.css'],
    standalone: true,
    imports: [NgClass],
})
export class BufferName {
  @Input()
  rootClassName: string = ''
  constructor() {}
}
