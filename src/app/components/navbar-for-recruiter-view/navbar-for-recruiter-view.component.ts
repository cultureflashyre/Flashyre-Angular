import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'navbar-for-recruiter-view',
  templateUrl: 'navbar-for-recruiter-view.component.html',
  styleUrls: ['navbar-for-recruiter-view.component.css'],
})
export class NavbarForRecruiterView {
  @ContentChild('text14')
  text14: TemplateRef<any>
  @Input()
  imageSrc1: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png'
  @Input()
  link4Url: string = 'https://www.teleporthq.io'
  @Input()
  imageAlt1: string = 'image'
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text13')
  text13: TemplateRef<any>
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text1411')
  text1411: TemplateRef<any>
  @ContentChild('text16')
  text16: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @Input()
  imageSrc4: string =
    'https://s3-alpha-sig.figma.com/img/7583/57be/ae9594f1160471db992db1cf36ca3f46?Expires=1738540800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=JE7txqF-B6mlyS6vVm8jDQNtPmNVIGVkOwGQawWSQEp6~GRMYRWAujE~YfsPMSJxrYRZ8aQLddL-FDlDZ81lzmRF~Ne94jCeoFq-yaK6oGmYbn-fajTwG672CtQraNnyKi8xBDKSzTynf2LH824kvvVOz~wnWqsPrNvZhjcbGoL1HOvN2J3CcCPFr54hAh~kpQWX0U3VAtHwDCZiIVxMdxYlQdAFGXUL7y36B4Ce7P91cvdiAO~iwKAT63Faez7KXBjp~IIB1J~UZLE8S3cMQJcIiD5M-mnL9IwJxqFst5lgJGikKxP1oa8MqkBlGx3Yg3MQkRmhYnIskawUWWFVcA__'
  @ContentChild('text32')
  text32: TemplateRef<any>
  @ContentChild('text7')
  text7: TemplateRef<any>
  @ContentChild('link1')
  link1: TemplateRef<any>
  @ContentChild('text11')
  text11: TemplateRef<any>
  @ContentChild('text12')
  text12: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @Input()
  imageAlt11: string = 'image'
  @Input()
  link1Url: string = 'https://www.teleporthq.io'
  @ContentChild('text15')
  text15: TemplateRef<any>
  @Input()
  imageSrc3: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__'
  @Input()
  imageAlt4: string = 'image'
  @Input()
  imageSrc11: string =
    'https://s3-alpha-sig.figma.com/img/cb33/d035/72e938963245d419674c3c2e71065794?Expires=1737331200&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=AWePlF-pHGfkDpvAxQkVOEKn6ei0wCQlVYu2oyaio65v32g8ylOmVbTs0muKAqz~iUBe-CPQTwUxEliMP5iFCiNMWlvaUDmnDaQ-9hL50Y2Rj~XfChKWsk1VhZQeHfMHDKP3KjN5DqeJBjU3k3Y3mOBUO9Fti0wsO9NNgpx1w4Kzu2hgpAP4Tf-EvspJzKotE8oB5AZzw1Qq6A~Vf6j1~AUW5vncBp6~E1xz7xUg0j59ZNm-wCSegvZWTPmBQ0fffJ95NegzQoPhltiUTwYrUPuIYjMEMcWOY3Poet~fqbTxf8bLNC1SRF3brHyO894K9GtoUm~V7HPmDgnR9J4qTg__'
  @ContentChild('text31')
  text31: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @Input()
  imageAlt3: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__'
  @ContentChild('text9')
  text9: TemplateRef<any>
  @ContentChild('link4')
  link4: TemplateRef<any>
  @ContentChild('text10')
  text10: TemplateRef<any>
  constructor() {}
}
