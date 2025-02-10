import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'app-component',
  templateUrl: 'component.component.html',
  styleUrls: ['component.component.css'],
})
export class AppComponent {
  @ContentChild('settings')
  settings: TemplateRef<any>
  @ContentChild('jobsForYouText')
  jobsForYouText: TemplateRef<any>
  @ContentChild('upskillLink')
  upskillLink: TemplateRef<any>
  @Input()
  userImageSrc1: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__'
  @ContentChild('preference')
  preference: TemplateRef<any>
  @ContentChild('profileScoreBoard')
  profileScoreBoard: TemplateRef<any>
  @Input()
  userImageAlt: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__'
  @ContentChild('assessmentText')
  assessmentText: TemplateRef<any>
  @ContentChild('preferenceText')
  preferenceText: TemplateRef<any>
  @ContentChild('upskillText')
  upskillText: TemplateRef<any>
  @Input()
  userImageAlt1: string = 'image'
  @ContentChild('viewEditProfile')
  viewEditProfile: TemplateRef<any>
  @ContentChild('settingsText')
  settingsText: TemplateRef<any>
  @Input()
  upskillLinkUrl: string = 'https://www.teleporthq.io'
  @ContentChild('profileCompletIndication')
  profileCompletIndication: TemplateRef<any>
  @ContentChild('dashboardText')
  dashboardText: TemplateRef<any>
  @Input()
  flashyreImageSrc: string =
    '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png'
  @ContentChild('jobPostedText')
  jobPostedText: TemplateRef<any>
  @Input()
  flashyreImageAlt: string = 'image'
  @ContentChild('profile')
  profile: TemplateRef<any>
  @Input()
  jobsForYouLinkUrl: string = 'https://www.teleporthq.io'
  @ContentChild('assessmentLink')
  assessmentLink: TemplateRef<any>
  @ContentChild('userName')
  userName: TemplateRef<any>
  @Input()
  dashboardLinkUrl: string = 'https://www.teleporthq.io'
  @ContentChild('logoutText')
  logoutText: TemplateRef<any>
  @ContentChild('logout')
  logout: TemplateRef<any>
  @ContentChild('jobsForYouLink')
  jobsForYouLink: TemplateRef<any>
  @ContentChild('numberOfJobPostedText')
  numberOfJobPostedText: TemplateRef<any>
  @ContentChild('dashboardLink')
  dashboardLink: TemplateRef<any>
  @Input()
  userImageSrc: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__'
  @Input()
  assessmentLinkUrl: string = 'https://www.teleporthq.io'
  constructor() {}
}
