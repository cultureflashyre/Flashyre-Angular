import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'recruiter-workflow-client-input-form',
  templateUrl: 'recruiter-workflow-client-input-form.component.html',
  styleUrls: ['recruiter-workflow-client-input-form.component.css'],
})
export class RecruiterWorkflowClientInputForm {
  @Input()
  jobTitleInputPlaceholder1: string = 'Enter Job Title'
  @Input()
  rootClassName: string = ''
  @ContentChild('skillStarText')
  skillStarText: TemplateRef<any>
  @Input()
  dateInputPlaceholder1: string = 'Spoc'
  @Input()
  jobTitleInputPlaceholder: string = 'Client Description'
  @ContentChild('jobTitleText')
  jobTitleText: TemplateRef<any>
  @Input()
  dateInputPlaceholder3: string = 'Email'
  @ContentChild('cancelText')
  cancelText: TemplateRef<any>
  @Input()
  dateInputPlaceholder2: string = 'Phone Number'
  @ContentChild('removeSectionText')
  removeSectionText: TemplateRef<any>
  @ContentChild('companyNameText')
  companyNameText: TemplateRef<any>
  @Input()
  dateInputPlaceholder: string = 'Location'
  @Input()
  companyNameInputPlaceholder: string = 'Enter Company Name'
  @ContentChild('skillText')
  skillText: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('addSectionText')
  addSectionText: TemplateRef<any>
  @ContentChild('interviewProcessText')
  interviewProcessText: TemplateRef<any>
  @ContentChild('submitText')
  submitText: TemplateRef<any>
  constructor() {}
}
