import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'recruiter-workflow-requirment-listing',
  templateUrl: 'recruiter-workflow-requirment-listing.component.html',
  styleUrls: ['recruiter-workflow-requirment-listing.component.css'],
})
export class RecruiterWorkflowRequirmentListing {
  @ContentChild('heading1')
  heading1: TemplateRef<any>
  @ContentChild('heading2')
  heading2: TemplateRef<any>
  @ContentChild('text14')
  text14: TemplateRef<any>
  @ContentChild('text19')
  text19: TemplateRef<any>
  @ContentChild('text4')
  text4: TemplateRef<any>
  @ContentChild('text24')
  text24: TemplateRef<any>
  @ContentChild('heading')
  heading: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('text12')
  text12: TemplateRef<any>
  @ContentChild('text91')
  text91: TemplateRef<any>
  @ContentChild('text9')
  text9: TemplateRef<any>
  @ContentChild('text17')
  text17: TemplateRef<any>
  @ContentChild('startProcessText1')
  startProcessText1: TemplateRef<any>
  @ContentChild('text25')
  text25: TemplateRef<any>
  @ContentChild('text18')
  text18: TemplateRef<any>
  @ContentChild('text21')
  text21: TemplateRef<any>
  @ContentChild('text6')
  text6: TemplateRef<any>
  @ContentChild('text22')
  text22: TemplateRef<any>
  @ContentChild('text26')
  text26: TemplateRef<any>
  @ContentChild('text10')
  text10: TemplateRef<any>
  @ContentChild('text16')
  text16: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text23')
  text23: TemplateRef<any>
  @ContentChild('text8')
  text8: TemplateRef<any>
  @ContentChild('text5')
  text5: TemplateRef<any>
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text13')
  text13: TemplateRef<any>
  @ContentChild('startProcessText')
  startProcessText: TemplateRef<any>
  @ContentChild('text7')
  text7: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @ContentChild('text11')
  text11: TemplateRef<any>
  @ContentChild('text15')
  text15: TemplateRef<any>
  @ContentChild('text20')
  text20: TemplateRef<any>
  constructor() {}
}
