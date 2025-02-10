import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'recruiter-job-posted1',
  templateUrl: 'recruiter-job-posted.component1.html',
  styleUrls: ['recruiter-job-posted.component1.css'],
})
export class RecruiterJobPosted1 {
  @ContentChild('text3')
  text3: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text')
  text: TemplateRef<any>
  constructor() {}
}
