import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { RecruiterProfile } from '../recruiter-profile/recruiter-profile.component';
import { DangerousHtmlComponent } from '../dangerous-html/dangerous-html.component';
@Component({
    selector: 'admin-navbar',
    templateUrl: 'admin-navbar.component.html',
    styleUrls: ['admin-navbar.component.css'],
    standalone: true,
    imports: [
        NgClass,
        NgTemplateOutlet,
        RecruiterProfile,
        DangerousHtmlComponent,
    ],
})
export class AdminNavbar {
  @ContentChild('profile')
  profile: TemplateRef<any>
  @Input()
  userImageAlt: string = 'image'
  @Input()
  dashboardLinkUrl: string = 'https://www.teleporthq.io'
  @ContentChild('jobsForYouLink')
  jobsForYouLink: TemplateRef<any>
  @ContentChild('logoutText')
  logoutText: TemplateRef<any>
  @Input()
  dashboardLinkUrl1: string = 'https://www.teleporthq.io'
  @ContentChild('jobsForYouText')
  jobsForYouText: TemplateRef<any>
  @Input()
  companyImageSrc: string =
    'https://s3-alpha-sig.figma.com/img/cb33/d035/72e938963245d419674c3c2e71065794?Expires=1737331200&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=AWePlF-pHGfkDpvAxQkVOEKn6ei0wCQlVYu2oyaio65v32g8ylOmVbTs0muKAqz~iUBe-CPQTwUxEliMP5iFCiNMWlvaUDmnDaQ-9hL50Y2Rj~XfChKWsk1VhZQeHfMHDKP3KjN5DqeJBjU3k3Y3mOBUO9Fti0wsO9NNgpx1w4Kzu2hgpAP4Tf-EvspJzKotE8oB5AZzw1Qq6A~Vf6j1~AUW5vncBp6~E1xz7xUg0j59ZNm-wCSegvZWTPmBQ0fffJ95NegzQoPhltiUTwYrUPuIYjMEMcWOY3Poet~fqbTxf8bLNC1SRF3brHyO894K9GtoUm~V7HPmDgnR9J4qTg__'
  @ContentChild('settings')
  settings: TemplateRef<any>
  @ContentChild('dashboardText')
  dashboardText: TemplateRef<any>
  @ContentChild('preferenceText')
  preferenceText: TemplateRef<any>
  @ContentChild('dashboardLink')
  dashboardLink: TemplateRef<any>
  @Input()
  flashyreImageAlt: string = 'image'
  @ContentChild('dashboardLink1')
  dashboardLink1: TemplateRef<any>
  @Input()
  userImageSrc: string =
    'https://s3-alpha-sig.figma.com/img/7583/57be/ae9594f1160471db992db1cf36ca3f46?Expires=1738540800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=JE7txqF-B6mlyS6vVm8jDQNtPmNVIGVkOwGQawWSQEp6~GRMYRWAujE~YfsPMSJxrYRZ8aQLddL-FDlDZ81lzmRF~Ne94jCeoFq-yaK6oGmYbn-fajTwG672CtQraNnyKi8xBDKSzTynf2LH824kvvVOz~wnWqsPrNvZhjcbGoL1HOvN2J3CcCPFr54hAh~kpQWX0U3VAtHwDCZiIVxMdxYlQdAFGXUL7y36B4Ce7P91cvdiAO~iwKAT63Faez7KXBjp~IIB1J~UZLE8S3cMQJcIiD5M-mnL9IwJxqFst5lgJGikKxP1oa8MqkBlGx3Yg3MQkRmhYnIskawUWWFVcA__'
  @ContentChild('logout')
  logout: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @Input()
  flashyreImageSrc: string =
    '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png'
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('notification')
  notification: TemplateRef<any>
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('jobRoleOfRecruiter')
  jobRoleOfRecruiter: TemplateRef<any>
  @ContentChild('settingsText')
  settingsText: TemplateRef<any>
  @Input()
  jobsForYouLinkUrl: string = 'https://www.teleporthq.io'
  @ContentChild('companyName')
  companyName: TemplateRef<any>
  @ContentChild('recruiterName')
  recruiterName: TemplateRef<any>
  @Input()
  companyImageAlt: string = 'image'
  @ContentChild('preference')
  preference: TemplateRef<any>
  constructor() {}
}
