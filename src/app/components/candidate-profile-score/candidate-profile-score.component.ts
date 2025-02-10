import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'candidate-profile-score',
  templateUrl: 'candidate-profile-score.component.html',
  styleUrls: ['candidate-profile-score.component.css'],
})
export class CandidateProfileScore {
  @ContentChild('text')
  text: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  constructor() {}
}
