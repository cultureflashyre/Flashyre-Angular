import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'signup-corporate1',
  templateUrl: 'signup-corporate1.component.html',
  styleUrls: ['signup-corporate1.component.css'],
})
export class SignupCorporate1 {
  @ContentChild('button')
  button: TemplateRef<any>
  @ContentChild('text12')
  text12: TemplateRef<any>
  @ContentChild('text13')
  text13: TemplateRef<any>
  @ContentChild('text1111')
  text1111: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('text11')
  text11: TemplateRef<any>
  @ContentChild('text5')
  text5: TemplateRef<any>
  @ContentChild('text21')
  text21: TemplateRef<any>
  @ContentChild('heading')
  heading: TemplateRef<any>
  @ContentChild('text111')
  text111: TemplateRef<any>
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text6')
  text6: TemplateRef<any>
  @ContentChild('text71')
  text71: TemplateRef<any>
  constructor() {}
}
