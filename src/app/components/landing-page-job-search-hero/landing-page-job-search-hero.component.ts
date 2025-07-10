import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'landing-page-job-search-hero',
  templateUrl: 'landing-page-job-search-hero.component.html',
  styleUrls: ['landing-page-job-search-hero.component.css'],
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
