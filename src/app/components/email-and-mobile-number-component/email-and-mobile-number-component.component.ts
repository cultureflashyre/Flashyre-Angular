import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'email-and-mobile-number-component',
  templateUrl: 'email-and-mobile-number-component.component.html',
  styleUrls: ['email-and-mobile-number-component.component.css'],
})
export class EmailAndMobileNumberComponent {
  @Input()
  textinputPlaceholder1: string = 'Enter Mobile number'
  @Input()
  rootClassName: string = ''
  @Input()
  textinputPlaceholder: string = 'Enter Email Id'
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  constructor() {}
}
