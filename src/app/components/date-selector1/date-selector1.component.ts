import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'date-selector1',
  templateUrl: 'date-selector1.component.html',
  styleUrls: ['date-selector1.component.css'],
})
export class DateSelector1 {
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @Input()
  textinputPlaceholder: string = 'Name'
  @ContentChild('text1')
  text1: TemplateRef<any>
  constructor() {}
}
