import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'landing-page-video-articles-card-small',
    templateUrl: 'landing-page-video-articles-card-small.component.html',
    styleUrls: ['landing-page-video-articles-card-small.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet],
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
