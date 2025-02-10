import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'profile-creation-navigation1',
  templateUrl: 'profile-creation-navigation1.component.html',
  styleUrls: ['profile-creation-navigation1.component.css'],
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
