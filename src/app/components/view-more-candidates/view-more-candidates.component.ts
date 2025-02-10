import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'view-more-candidates',
  templateUrl: 'view-more-candidates.component.html',
  styleUrls: ['view-more-candidates.component.css'],
})
export class ViewMoreCandidates {
  @ContentChild('text')
  text: TemplateRef<any>
  constructor() {}
}
