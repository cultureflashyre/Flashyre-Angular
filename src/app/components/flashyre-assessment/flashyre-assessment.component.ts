import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'flashyre-assessment',
  templateUrl: 'flashyre-assessment.component.html',
  styleUrls: ['flashyre-assessment.component.css'],
})
export class FlashyreAssessment {
  @ContentChild('text912')
  text912: TemplateRef<any>
  @ContentChild('text1441')
  text1441: TemplateRef<any>
  @ContentChild('button1')
  button1: TemplateRef<any>
  @ContentChild('heading')
  heading: TemplateRef<any>
  @ContentChild('text5')
  text5: TemplateRef<any>
  @ContentChild('text97')
  text97: TemplateRef<any>
  @Input()
  imageSrc3: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png'
  @ContentChild('text95')
  text95: TemplateRef<any>
  @ContentChild('heading1')
  heading1: TemplateRef<any>
  @Input()
  imageAlt3: string = 'image'
  @ContentChild('text144')
  text144: TemplateRef<any>
  @ContentChild('text52')
  text52: TemplateRef<any>
  @ContentChild('text94')
  text94: TemplateRef<any>
  @ContentChild('text13')
  text13: TemplateRef<any>
  @ContentChild('text92')
  text92: TemplateRef<any>
  @ContentChild('text96')
  text96: TemplateRef<any>
  @ContentChild('text99')
  text99: TemplateRef<any>
  @ContentChild('text14411')
  text14411: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text913')
  text913: TemplateRef<any>
  @ContentChild('text12')
  text12: TemplateRef<any>
  @ContentChild('text915')
  text915: TemplateRef<any>
  @ContentChild('text910')
  text910: TemplateRef<any>
  @ContentChild('text14')
  text14: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text98')
  text98: TemplateRef<any>
  @ContentChild('text93')
  text93: TemplateRef<any>
  @ContentChild('text914')
  text914: TemplateRef<any>
  @ContentChild('button6')
  button6: TemplateRef<any>
  @ContentChild('text9151')
  text9151: TemplateRef<any>
  @ContentChild('text911')
  text911: TemplateRef<any>
  @ContentChild('text9')
  text9: TemplateRef<any>
  constructor() {}
}
