import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'input-date-component',
  templateUrl: 'input-date-component.component.html',
  styleUrls: ['input-date-component.component.css'],
})
export class InputDateComponent {
  @ContentChild('text31')
  text31: TemplateRef<any>
  @ContentChild('text11')
  text11: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  constructor() {}
}
