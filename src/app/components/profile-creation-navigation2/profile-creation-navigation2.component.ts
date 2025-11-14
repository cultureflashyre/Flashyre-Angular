import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'profile-creation-navigation2',
    templateUrl: 'profile-creation-navigation2.component.html',
    styleUrls: ['profile-creation-navigation2.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet],
})
export class ProfileCreationNavigation2 {
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('button')
  button: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('button1')
  button1: TemplateRef<any>
  constructor() {}
}
