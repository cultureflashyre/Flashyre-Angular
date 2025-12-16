import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'profile-creation-navigation1',
    templateUrl: 'profile-creation-navigation1.component.html',
    styleUrls: ['profile-creation-navigation1.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet],
})
export class ProfileCreationNavigation1 {
  @ContentChild('text1')
  text1: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text')
  text: TemplateRef<any>
  constructor() {}
}
