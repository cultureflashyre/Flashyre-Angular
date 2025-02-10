import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'profile-header-component1',
  templateUrl: 'profile-header-component1.component.html',
  styleUrls: ['profile-header-component1.component.css'],
})
export class ProfileHeaderComponent1 {
  @ContentChild('link3')
  link3: TemplateRef<any>
  @ContentChild('link4')
  link4: TemplateRef<any>
  @Input()
  logoAlt: string = 'Company Logo'
  @ContentChild('link5')
  link5: TemplateRef<any>
  @ContentChild('action2')
  action2: TemplateRef<any>
  @Input()
  link4Url: string = 'https://www.teleporthq.io'
  @ContentChild('action1')
  action1: TemplateRef<any>
  @Input()
  link5Url: string = 'https://www.teleporthq.io'
  @Input()
  link2Url: string = 'https://www.teleporthq.io'
  @Input()
  link1Url: string = 'https://www.teleporthq.io'
  @Input()
  logoSrc: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-1500h.png'
  @ContentChild('text41')
  text41: TemplateRef<any>
  @ContentChild('link2')
  link2: TemplateRef<any>
  @Input()
  link3Url: string = 'https://www.teleporthq.io'
  @ContentChild('link1')
  link1: TemplateRef<any>
  constructor() {}
}
