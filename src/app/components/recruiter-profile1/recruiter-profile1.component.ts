import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'recruiter-profile1',
    templateUrl: 'recruiter-profile1.component.html',
    styleUrls: ['recruiter-profile1.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet],
})
export class RecruiterProfile1 {
  @Input()
  rootClassName: string = ''
  @Input()
  imageAlt1: string = 'image'
  @Input()
  imageSrc1: string =
    'https://s3-alpha-sig.figma.com/img/cb33/d035/72e938963245d419674c3c2e71065794?Expires=1737331200&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=AWePlF-pHGfkDpvAxQkVOEKn6ei0wCQlVYu2oyaio65v32g8ylOmVbTs0muKAqz~iUBe-CPQTwUxEliMP5iFCiNMWlvaUDmnDaQ-9hL50Y2Rj~XfChKWsk1VhZQeHfMHDKP3KjN5DqeJBjU3k3Y3mOBUO9Fti0wsO9NNgpx1w4Kzu2hgpAP4Tf-EvspJzKotE8oB5AZzw1Qq6A~Vf6j1~AUW5vncBp6~E1xz7xUg0j59ZNm-wCSegvZWTPmBQ0fffJ95NegzQoPhltiUTwYrUPuIYjMEMcWOY3Poet~fqbTxf8bLNC1SRF3brHyO894K9GtoUm~V7HPmDgnR9J4qTg__'
  @ContentChild('text1')
  text1: TemplateRef<any>
  @Input()
  imageSrc: string =
    'https://s3-alpha-sig.figma.com/img/7583/57be/ae9594f1160471db992db1cf36ca3f46?Expires=1737331200&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=YcWbI63KCs-l2t3rvITZLODNvQZtlk2BY7VyfMFWhbpet~Nf9jMZXmDdHbIGcOPoq2btvJgHpgkayhtfCcU3GmeBOYVbNaILBhnlZ~7fSmYYU--2WsEUolK~5YZzxQXJ3KmuZXbnLnfx5zJz57tl8Pk0n84K3AwQ9iTt0ffzXBgJnVj244OA~2QXcczS-OgH60aKwbaEGfBgjrZ-mzGVcdz7mbNsD-vtvUDvASfxXwlZ1DTQYvTi5dhga4oyuEvonqOzfv2lwGSPfsYrdIixsYvNHE465SWZm10N1yK8GdvFr-zEV1CJBKaIbaO~2rFxxY2Gt-9DonYdy8hjlb3pNw__'
  @ContentChild('text')
  text: TemplateRef<any>
  @Input()
  imageAlt: string = 'image'
  @ContentChild('text3')
  text3: TemplateRef<any>
  constructor() {}
}
