import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'assessment-questions-main-container',
    templateUrl: 'assessment-questions-main-container.component.html',
    styleUrls: ['assessment-questions-main-container.component.css'],
    standalone: true,
    imports: [NgTemplateOutlet],
})
export class AssessmentQuestionsMainContainer {
  @ContentChild('aiGeneratedText')
  aiGeneratedText: TemplateRef<any>
  @ContentChild('phoneAccessText')
  phoneAccessText: TemplateRef<any>
  @ContentChild('sectionNameText')
  sectionNameText: TemplateRef<any>
  @ContentChild('marks')
  marks: TemplateRef<any>
  @ContentChild('assessmentQuestionsText')
  assessmentQuestionsText: TemplateRef<any>
  @ContentChild('chooseSectionsText')
  chooseSectionsText: TemplateRef<any>
  @ContentChild('uploadText')
  uploadText: TemplateRef<any>
  @ContentChild('uploadFileTypeText')
  uploadFileTypeText: TemplateRef<any>
  @ContentChild('selectAllText')
  selectAllText: TemplateRef<any>
  @ContentChild('uploadedQuestionsText')
  uploadedQuestionsText: TemplateRef<any>
  @ContentChild('option1')
  option1: TemplateRef<any>
  @ContentChild('hardText')
  hardText: TemplateRef<any>
  @ContentChild('option2')
  option2: TemplateRef<any>
  @ContentChild('easyText')
  easyText: TemplateRef<any>
  @ContentChild('procteredText')
  procteredText: TemplateRef<any>
  @ContentChild('videoRecordingText')
  videoRecordingText: TemplateRef<any>
  @ContentChild('question')
  question: TemplateRef<any>
  @ContentChild('totalQuestionsText')
  totalQuestionsText: TemplateRef<any>
  @Input()
  uploadInputFieldPlaceholder: string = 'Upload Questions'
  @ContentChild('mediumText')
  mediumText: TemplateRef<any>
  @ContentChild('shuffleText')
  shuffleText: TemplateRef<any>
  @ContentChild('addSectionText')
  addSectionText: TemplateRef<any>
  @Input()
  assessmentNameInputPlaceholder: string = 'Assessment Name'
  @ContentChild('option3')
  option3: TemplateRef<any>
  @ContentChild('numSelectedText')
  numSelectedText: TemplateRef<any>
  @ContentChild('option4')
  option4: TemplateRef<any>
  @ContentChild('selectAllText1')
  selectAllText1: TemplateRef<any>
  raw4lwf: string = ' '
  rawr4wp: string = ' '
  constructor() {}
}
