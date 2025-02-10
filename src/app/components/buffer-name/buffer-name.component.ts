import { Component, Input } from '@angular/core'

@Component({
  selector: 'buffer-name',
  templateUrl: 'buffer-name.component.html',
  styleUrls: ['buffer-name.component.css'],
})
export class BufferName {
  @Input()
  rootClassName: string = ''
  constructor() {}
}
