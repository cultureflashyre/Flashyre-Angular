import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'navbar-for-recruiter-view-option',
    templateUrl: 'navbar-for-recruiter-view-option.component.html',
    styleUrls: ['navbar-for-recruiter-view-option.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet],
})
export class NavbarForRecruiterViewOption {
  @ContentChild('text101')
  text101: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('link1')
  link1: TemplateRef<any>
  @ContentChild('link4')
  link4: TemplateRef<any>
  @ContentChild('text4')
  text4: TemplateRef<any>
  @Input()
  link4Url: string = 'https://www.teleporthq.io'
  @ContentChild('text10111')
  text10111: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text101111')
  text101111: TemplateRef<any>
  @Input()
  link1Url: string = 'https://www.teleporthq.io'
  @ContentChild('text71')
  text71: TemplateRef<any>
  @Input()
  imageSrc3: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__'
  @Input()
  imageSrc1: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png'
  @Input()
  imageSrc4: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__'
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text6')
  text6: TemplateRef<any>
  @Input()
  imageAlt4: string = 'image'
  @ContentChild('text141')
  text141: TemplateRef<any>
  @ContentChild('text31')
  text31: TemplateRef<any>
  @ContentChild('text5')
  text5: TemplateRef<any>
  @ContentChild('text1411')
  text1411: TemplateRef<any>
  @Input()
  imageAlt3: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__'
  @ContentChild('text1011')
  text1011: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @ContentChild('text91')
  text91: TemplateRef<any>
  @Input()
  imageAlt1: string = 'image'
  @ContentChild('text')
  text: TemplateRef<any>
  constructor() {}
}
