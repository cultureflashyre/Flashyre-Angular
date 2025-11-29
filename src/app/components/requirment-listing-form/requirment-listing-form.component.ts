import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'requirment-listing-form',
  templateUrl: 'requirment-listing-form.component.html',
  styleUrls: ['requirment-listing-form.component.css'],
})
export class RequirmentListingForm {
  @Input()
  companyNameInputPlaceholder5: string = 'Max Experience'
  @ContentChild('interviewProcessText')
  interviewProcessText: TemplateRef<any>
  @ContentChild('credentialsText')
  credentialsText: TemplateRef<any>
  @ContentChild('issuingDateText')
  issuingDateText: TemplateRef<any>
  @Input()
  companyNameInputPlaceholder1: string = 'Enter Date'
  @ContentChild('submitText')
  submitText: TemplateRef<any>
  @Input()
  jobTitleInputPlaceholder: string = 'Enter Job Description'
  @ContentChild('companyNameText1')
  companyNameText1: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('text4')
  text4: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('selectText')
  selectText: TemplateRef<any>
  @Input()
  uploadFileInputPlaceholder: string = 'Select file'
  @Input()
  dateInputPlaceholder2: string = 'Number of vacencies'
  @ContentChild('enterManuallyText')
  enterManuallyText: TemplateRef<any>
  @ContentChild('renewalDateText')
  renewalDateText: TemplateRef<any>
  @ContentChild('text5')
  text5: TemplateRef<any>
  @ContentChild('jobTitleText1')
  jobTitleText1: TemplateRef<any>
  @ContentChild('skillText')
  skillText: TemplateRef<any>
  @Input()
  companyNameInputPlaceholder6: string = 'Min Salary'
  @ContentChild('certificateNameText')
  certificateNameText: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @ContentChild('issuingDateText1')
  issuingDateText1: TemplateRef<any>
  @Input()
  companyNameInputPlaceholder3: string = 'Max Experience'
  @ContentChild('skillStarText')
  skillStarText: TemplateRef<any>
  @ContentChild('companyNameText')
  companyNameText: TemplateRef<any>
  @Input()
  dateInputPlaceholder1: string = 'Spoc'
  @Input()
  jobTitleInputPlaceholder1: string = 'Enter Client Name'
  @ContentChild('addSectionText')
  addSectionText: TemplateRef<any>
  @ContentChild('text2')
  text2: TemplateRef<any>
  @Input()
  companyNameInputPlaceholder4: string = 'Min Experience'
  @Input()
  companyNameInputPlaceholder7: string = 'Max Salary'
  @ContentChild('heading1')
  heading1: TemplateRef<any>
  @ContentChild('removeSectionText')
  removeSectionText: TemplateRef<any>
  @ContentChild('issuingDateText2')
  issuingDateText2: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('jobTitleText')
  jobTitleText: TemplateRef<any>
  @Input()
  dateInputPlaceholder: string = 'Location'
  @ContentChild('selectText1')
  selectText1: TemplateRef<any>
  @Input()
  jobTitleInputPlaceholder2: string = 'Enter Job Location'
  @ContentChild('selectText2')
  selectText2: TemplateRef<any>
  @ContentChild('heading')
  heading: TemplateRef<any>
  @ContentChild('text6')
  text6: TemplateRef<any>
  @ContentChild('noteForFile')
  noteForFile: TemplateRef<any>
  @ContentChild('text7')
  text7: TemplateRef<any>
  @Input()
  companyNameInputPlaceholder: string = 'Enter Sub Client Name'
  @ContentChild('cancelText')
  cancelText: TemplateRef<any>
  @Input()
  companyNameInputPlaceholder2: string = 'Min Experience'
  constructor() {}
}
