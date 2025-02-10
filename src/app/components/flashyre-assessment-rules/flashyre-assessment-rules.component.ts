import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'flashyre-assessment-rules',
  templateUrl: 'flashyre-assessment-rules.component.html',
  styleUrls: ['flashyre-assessment-rules.component.css'],
})
export class FlashyreAssessmentRules {
  @ContentChild('text2')
  text2: TemplateRef<any>
  @Input()
  imageSrc3: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png'
  @ContentChild('text311')
  text311: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('text61')
  text61: TemplateRef<any>
  @ContentChild('text9')
  text9: TemplateRef<any>
  @ContentChild('text211')
  text211: TemplateRef<any>
  @Input()
  imageAlt3: string = 'image'
  @ContentChild('text3111')
  text3111: TemplateRef<any>
  @ContentChild('text412')
  text412: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text8')
  text8: TemplateRef<any>
  @ContentChild('text411')
  text411: TemplateRef<any>
  @ContentChild('text41')
  text41: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @ContentChild('text21')
  text21: TemplateRef<any>
  @ContentChild('text41112')
  text41112: TemplateRef<any>
  @ContentChild('text7')
  text7: TemplateRef<any>
  @ContentChild('text5')
  text5: TemplateRef<any>
  @ContentChild('text31')
  text31: TemplateRef<any>
  @ContentChild('text2111')
  text2111: TemplateRef<any>
  @ContentChild('text4')
  text4: TemplateRef<any>
  @ContentChild('text4111')
  text4111: TemplateRef<any>
  @ContentChild('button')
  button: TemplateRef<any>
  constructor() {}
}
