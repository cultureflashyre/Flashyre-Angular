import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'recruiter-job-posted',
  templateUrl: 'recruiter-job-posted.component.html',
  styleUrls: ['recruiter-job-posted.component.css'],
})
export class RecruiterJobPosted {
  @ContentChild('text')
  text: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  constructor() {}
}
