import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'landing-page-navbar',
  templateUrl: 'landing-page-navbar.component.html',
  styleUrls: ['landing-page-navbar.component.css'],
})
export class LandingPageNavbar {
  @ContentChild('text2')
  text2: TemplateRef<any>
  @Input()
  imageAlt1: string = 'image'
  @ContentChild('link4')
  link4: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @ContentChild('text9')
  text9: TemplateRef<any>
  @ContentChild('text13')
  text13: TemplateRef<any>
  @Input()
  link4Url: string = 'https://www.teleporthq.io'
  @Input()
  rootClassName: string = ''
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text10')
  text10: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @Input()
  link3Url: string = 'https://www.teleporthq.io'
  @ContentChild('text12')
  text12: TemplateRef<any>
  @ContentChild('text11')
  text11: TemplateRef<any>
  @Input()
  imageSrc1: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png'
  @ContentChild('link3')
  link3: TemplateRef<any>
  constructor() {}
}
