import { Component, Input, ContentChild, TemplateRef } from '@angular/core';

@Component({
  selector: 'navbar-for-candidate-view',
  templateUrl: 'navbar-for-candidate-view.component.html',
  styleUrls: ['navbar-for-candidate-view.component.css'],
})
export class NavbarForCandidateView {

  userProfile: any = {}; // To store user profile data
  defaultProfilePicture: string = "/assets/placeholders/profile-placeholder.jpg";

  @Input() rootClassName: string = '';
  @Input() imageSrc12: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png';
  @Input() imageAlt12: string = 'image';
  @ContentChild('link11') link11: TemplateRef<any>;
  @Input() link1Url1: string = 'https://www.teleporthq.io';
  @ContentChild('link12') link12: TemplateRef<any>;
  @Input() link1Url2: string = 'https://www.teleporthq.io';
  @ContentChild('link111') link111: TemplateRef<any>;
  @Input() link1Url11: string = 'https://www.teleporthq.io';
  @Input() link4Url1: string = 'https://www.teleporthq.io';
  @ContentChild('link41') link41: TemplateRef<any>;
  @Input() imageSrc31: string = 'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__';
  @Input() imageAlt31: string = 'image';
  @ContentChild('text17') text17: TemplateRef<any>;
  @ContentChild('text21') text21: TemplateRef<any>;
  @ContentChild('text33') text33: TemplateRef<any>;
  @ContentChild('text311') text311: TemplateRef<any>;
  @Input() imageSrc44: string = 'https://s3-alpha-sig.figma.com/img/7583/57be/ae9594f1160471db992db1cf36ca3f46?Expires=1738540800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=JE7txqF-B6mlyS6vVm8jDQNtPmNVIGVkOwGQawWSQEp6~GRMYRWAujE~YfsPMSJxrYRZ8aQLddL-FDlDZ81lzmRF~Ne94jCeoFq-yaK6oGmYbn-fajTwG672CtQraNnyKi8xBDKSzTynf2LH824kvvVOz~wnWqsPrNvZhjcbGoL1HOvN2J3CcCPFr54hAh~kpQWX0U3VAtHwDCZiIVxMdxYlQdAFGXUL7y36B4Ce7P91cvdiAO~iwKAT63Faez7KXBjp~IIB1J~UZLE8S3cMQJcIiD5M-mnL9IwJxqFst5lgJGikKxP1oa8MqkBlGx3Yg3MQkRmhYnIskawUWWFVcA__';
  @Input() imageAlt44: string = 'image';
  @ContentChild('text154') text154: TemplateRef<any>;
  @ContentChild('text324') text324: TemplateRef<any>;
  @ContentChild('text74') text74: TemplateRef<any>;
  @ContentChild('text104') text104: TemplateRef<any>;
  @ContentChild('text1011') text1011: TemplateRef<any>;
  @ContentChild('text10111') text10111: TemplateRef<any>;
  @Input() imageAlt113: string = 'image';
  @Input() imageSrc113: string = 'https://s3-alpha-sig.figma.com/img/cb33/d035/72e938963245d419674c3c2e71065794?Expires=1737331200&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=AWePlF-pHGfkDpvAxQkVOEKn6ei0wCQlVYu2oyaio65v32g8ylOmVbTs0muKAqz~iUBe-CPQTwUxEliMP5iFCiNMWlvaUDmnDaQ-9hL50Y2Rj~XfChKWsk1VhZQeHfMHDKP3KjN5DqeJBjU3k3Y3mOBUO9Fti0wsO9NNgpx1w4Kzu2hgpAP4Tf-EvspJzKotE8oB5AZzw1Qq6A~Vf6j1~AUW5vncBp6~E1xz7xUg0j59ZNm-wCSegvZWTPmBQ0fffJ95NegzQoPhltiUTwYrUPuIYjMEMcWOY3Poet~fqbTxf8bLNC1SRF3brHyO894K9GtoUm~V7HPmDgnR9J4qTg__';
  @ContentChild('text163') text163: TemplateRef<any>;
  @ContentChild('text114') text114: TemplateRef<any>;
  @ContentChild('text124') text124: TemplateRef<any>;
  @ContentChild('text134') text134: TemplateRef<any>;

  // Add a flag to track if the menu is open
  isMenuOpen: boolean = false;

  constructor() {}

  // Toggle the menu visibility
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
