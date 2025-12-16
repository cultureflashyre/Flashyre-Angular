import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'recruiter-flow-profile-card',
    templateUrl: 'recruiter-flow-profile-card.component.html',
    styleUrls: ['recruiter-flow-profile-card.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet],
})
export class RecruiterFlowProfileCard {
  @Input()
  imageSrc: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__'
  @ContentChild('text5')
  text5: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @Input()
  imageAlt: string = 'image'
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text4')
  text4: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text3')
  text3: TemplateRef<any>
  constructor() {}
}
