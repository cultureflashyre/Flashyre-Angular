import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'landing-page-readable-articles-card-small',
  templateUrl: 'landing-page-readable-articles-card-small.component.html',
  styleUrls: ['landing-page-readable-articles-card-small.component.css'],
})
export class LandingPageReadableArticlesCardSmall {
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  constructor() {}
}
