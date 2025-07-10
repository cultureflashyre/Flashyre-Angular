import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'app-footer8',
  templateUrl: 'footer8.component.html',
  styleUrls: ['footer8.component.css'],
})
export class Footer8 {
  @Input()
  logoAlt: string = 'Company Logo'
  @ContentChild('link10')
  link10: TemplateRef<any>
  @ContentChild('column2Title')
  column2Title: TemplateRef<any>
  @ContentChild('link7')
  link7: TemplateRef<any>
  @ContentChild('link6')
  link6: TemplateRef<any>
  @ContentChild('link9')
  link9: TemplateRef<any>
  @Input()
  logoSrc: string =
    'https://presentation-website-assets.teleporthq.io/logos/logo.png'
  @ContentChild('privacyLink')
  privacyLink: TemplateRef<any>
  @ContentChild('link2')
  link2: TemplateRef<any>
  @ContentChild('link4')
  link4: TemplateRef<any>
  @ContentChild('termsLink')
  termsLink: TemplateRef<any>
  @ContentChild('link3')
  link3: TemplateRef<any>
  @ContentChild('link5')
  link5: TemplateRef<any>
  @ContentChild('column1Title')
  column1Title: TemplateRef<any>
  @ContentChild('copyright')
  copyright: TemplateRef<any>
  @ContentChild('cookiesLink')
  cookiesLink: TemplateRef<any>
  @ContentChild('link1')
  link1: TemplateRef<any>
  @ContentChild('link8')
  link8: TemplateRef<any>
  constructor() {}
}
