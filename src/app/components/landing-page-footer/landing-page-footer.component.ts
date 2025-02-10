import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'landing-page-footer',
  templateUrl: 'landing-page-footer.component.html',
  styleUrls: ['landing-page-footer.component.css'],
})
export class LandingPageFooter {
  @Input()
  logoAlt: string = 'Company Logo'
  @ContentChild('cookiesLink')
  cookiesLink: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('column2Title')
  column2Title: TemplateRef<any>
  @ContentChild('link5')
  link5: TemplateRef<any>
  @Input()
  logoSrc: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-1500h.png'
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('link4')
  link4: TemplateRef<any>
  @ContentChild('link9')
  link9: TemplateRef<any>
  @ContentChild('link8')
  link8: TemplateRef<any>
  @ContentChild('link7')
  link7: TemplateRef<any>
  @ContentChild('column1Title')
  column1Title: TemplateRef<any>
  @ContentChild('link6')
  link6: TemplateRef<any>
  @ContentChild('privacyLink')
  privacyLink: TemplateRef<any>
  @ContentChild('copyright')
  copyright: TemplateRef<any>
  @ContentChild('link10')
  link10: TemplateRef<any>
  @ContentChild('link1')
  link1: TemplateRef<any>
  @ContentChild('termsLink')
  termsLink: TemplateRef<any>
  @ContentChild('link2')
  link2: TemplateRef<any>
  @ContentChild('link3')
  link3: TemplateRef<any>
  constructor() {}
}
