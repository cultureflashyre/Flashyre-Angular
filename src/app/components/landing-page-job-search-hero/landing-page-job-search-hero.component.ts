import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'landing-page-job-search-hero',
    templateUrl: 'landing-page-job-search-hero.component.html',
    styleUrls: ['landing-page-job-search-hero.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet],
})
export class LandingPageJobSearchHero {
  @ContentChild('button')
  button: TemplateRef<any>
  @ContentChild('heading')
  heading: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  constructor() {}
}
