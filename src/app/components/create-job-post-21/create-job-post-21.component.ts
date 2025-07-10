import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'create-job-post21',
  templateUrl: 'create-job-post-21.component.html',
  styleUrls: ['create-job-post-21.component.css'],
})
export class CreateJobPost21 {
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text21')
  text21: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text3')
  text3: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  raw3xdg: string = ' '
  rawhj43: string = ' '
  rawwand: string = ' '
  rawu3wv: string = ' '
  constructor() {}
}
