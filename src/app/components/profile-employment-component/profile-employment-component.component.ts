import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'profile-employment-component',
  templateUrl: 'profile-employment-component.component.html',
  styleUrls: ['profile-employment-component.component.css'],
})
export class ProfileEmploymentComponent {
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text311')
  text311: TemplateRef<any>
  @ContentChild('text7')
  text7: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text12')
  text12: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @ContentChild('text111')
  text111: TemplateRef<any>
  constructor() {}
}
