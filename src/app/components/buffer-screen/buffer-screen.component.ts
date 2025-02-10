import { Component, Input } from '@angular/core'

@Component({
  selector: 'buffer-screen',
  templateUrl: 'buffer-screen.component.html',
  styleUrls: ['buffer-screen.component.css'],
})
export class BufferScreen {
  @Input()
  rootClassName: string = ''
  constructor() {}
}
