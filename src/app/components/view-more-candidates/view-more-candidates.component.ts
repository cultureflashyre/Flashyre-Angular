import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'view-more-candidates',
    templateUrl: 'view-more-candidates.component.html',
    styleUrls: ['view-more-candidates.component.css'],
    standalone: true,
    imports: [NgTemplateOutlet],
})
export class ViewMoreCandidates {
  @ContentChild('text')
  text: TemplateRef<any>
  constructor() {}
}
