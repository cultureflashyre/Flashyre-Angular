import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'preference-component',
  templateUrl: 'preference-component.component.html',
  styleUrls: ['preference-component.component.css'],
})
export class PreferenceComponent {
  @Input() preferences: any;
  @Input() rootClassName: string = ''
  @ContentChild('text211')
  text211: TemplateRef<any>
  @ContentChild('text2111')
  text2111: TemplateRef<any>
  @ContentChild('button2')
  button2: TemplateRef<any>
  @ContentChild('text1211')
  text1211: TemplateRef<any>
  @ContentChild('text114')
  text114: TemplateRef<any>
  @ContentChild('text212')
  text212: TemplateRef<any>
  @ContentChild('text22')
  text22: TemplateRef<any>
  @ContentChild('text21')
  text21: TemplateRef<any>
  @ContentChild('text13')
  text13: TemplateRef<any>
  @ContentChild('text1113')
  text1113: TemplateRef<any>
  @ContentChild('text12')
  text12: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text121')
  text121: TemplateRef<any>
  constructor() {}
}
