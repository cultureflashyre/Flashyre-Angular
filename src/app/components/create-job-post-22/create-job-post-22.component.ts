import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'create-job-post22',
  templateUrl: 'create-job-post-22.component.html',
  styleUrls: ['create-job-post-22.component.css'],
})
export class CreateJobPost22 {
  @ContentChild('shuffleQuestionsText')
  shuffleQuestionsText: TemplateRef<any>
  @ContentChild('text17')
  text17: TemplateRef<any>
  @ContentChild('text161')
  text161: TemplateRef<any>
  @ContentChild('text18111')
  text18111: TemplateRef<any>
  @Input()
  timeInputPlaceholder: string = 'HH:MM'
  @ContentChild('difficultyLevelText')
  difficultyLevelText: TemplateRef<any>
  @ContentChild('text181')
  text181: TemplateRef<any>
  @ContentChild('text7')
  text7: TemplateRef<any>
  @ContentChild('text16')
  text16: TemplateRef<any>
  @ContentChild('allowPhoneAccessText')
  allowPhoneAccessText: TemplateRef<any>
  @ContentChild('text14')
  text14: TemplateRef<any>
  @ContentChild('text21')
  text21: TemplateRef<any>
  @ContentChild('text4')
  text4: TemplateRef<any>
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text18')
  text18: TemplateRef<any>
  @ContentChild('text11')
  text11: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text30')
  text30: TemplateRef<any>
  @ContentChild('text162')
  text162: TemplateRef<any>
  @ContentChild('text8')
  text8: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @ContentChild('text13')
  text13: TemplateRef<any>
  @ContentChild('allowVideoRecordingText')
  allowVideoRecordingText: TemplateRef<any>
  @ContentChild('text9')
  text9: TemplateRef<any>
  @ContentChild('text5')
  text5: TemplateRef<any>
  @ContentChild('proctoredText')
  proctoredText: TemplateRef<any>
  @ContentChild('text6')
  text6: TemplateRef<any>
  @ContentChild('button1')
  button1: TemplateRef<any>
  @ContentChild('timeLimitText')
  timeLimitText: TemplateRef<any>
  @ContentChild('text12')
  text12: TemplateRef<any>
  @ContentChild('text10')
  text10: TemplateRef<any>
  @ContentChild('text15')
  text15: TemplateRef<any>
  @ContentChild('text2111')
  text2111: TemplateRef<any>
  @ContentChild('text211')
  text211: TemplateRef<any>
  rawps5t: string = ' '
  raw4lng: string = ' '
  constructor() {}
}
