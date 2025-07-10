import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'landing-page-video-articles-card-small',
  templateUrl: 'landing-page-video-articles-card-small.component.html',
  styleUrls: ['landing-page-video-articles-card-small.component.css'],
})
export class LandingPageVideoArticlesCardSmall {
  @ContentChild('text')
  text: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text1')
  text1: TemplateRef<any>
  constructor() {}
}
