import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'landing-page-article-card',
  templateUrl: 'landing-page-article-card.component.html',
  styleUrls: ['landing-page-article-card.component.css'],
})
export class LandingPageArticleCard {
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  rawlhzn: string = ' '
  rawvmm3: string = ' '
  constructor() {}
}
