import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'recruiter-workflow-client-list',
  templateUrl: 'recruiter-workflow-client-list.component.html',
  styleUrls: ['recruiter-workflow-client-list.component.css'],
})
export class RecruiterWorkflowClientList {
  @ContentChild('startProcessText')
  startProcessText: TemplateRef<any>
  @ContentChild('text8')
  text8: TemplateRef<any>
  @ContentChild('text14')
  text14: TemplateRef<any>
  @ContentChild('heading1')
  heading1: TemplateRef<any>
  @ContentChild('text16')
  text16: TemplateRef<any>
  @ContentChild('heading')
  heading: TemplateRef<any>
  @ContentChild('text15')
  text15: TemplateRef<any>
  @ContentChild('text6')
  text6: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @ContentChild('text13')
  text13: TemplateRef<any>
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text17')
  text17: TemplateRef<any>
  @ContentChild('text4')
  text4: TemplateRef<any>
  @ContentChild('text12')
  text12: TemplateRef<any>
  @ContentChild('text10')
  text10: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text5')
  text5: TemplateRef<any>
  @ContentChild('text9')
  text9: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text11')
  text11: TemplateRef<any>
  @ContentChild('heading3')
  heading3: TemplateRef<any>
  @ContentChild('text91')
  text91: TemplateRef<any>
  @ContentChild('heading2')
  heading2: TemplateRef<any>
  @ContentChild('text7')
  text7: TemplateRef<any>
  @ContentChild('startProcessText1')
  startProcessText1: TemplateRef<any>
  constructor() {}
}
