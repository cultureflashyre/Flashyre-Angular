import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'recruiter-job-posted1',
  templateUrl: 'recruiter-job-posted1.component.html',
  styleUrls: ['recruiter-job-posted1.component.css'],
})
export class RecruiterJobPosted1 {
  @ContentChild('text3')
  text3: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  constructor() {}
}
