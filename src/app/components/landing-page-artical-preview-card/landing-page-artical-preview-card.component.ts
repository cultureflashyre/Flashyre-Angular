import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'landing-page-artical-preview-card',
    templateUrl: 'landing-page-artical-preview-card.component.html',
    styleUrls: ['landing-page-artical-preview-card.component.css'],
    standalone: true,
    imports: [NgTemplateOutlet],
})
export class LandingPageArticalPreviewCard {
  @ContentChild('text1')
  text1: TemplateRef<any>
  @Input()
  imageSrc: string =
    'https://s3-alpha-sig.figma.com/img/962b/1418/86991eb8090142d60c63254e7e7b9b51?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=TecfqcVZTMVxfR3S3VuT3eZyGXkL7vzzEL5o2jSlRpK5jbIpsflcVhaIgECODeXp8vYxL9qkaOvIfeVyOr-gDeB~Ylw9jLH9Y5FkJTrghARB0PkxshZadw-oaKJCVVRJxqGU2-iUa78JRZRDaFF0echcyo8L0xi8HugiVz15WFBQ9w0I24Un3HY4xmpRpCpbP03x91JGfpQQ6nD8o-Qml-fI45m-Q8SKtHe93EgL6L3N7dQIW7JdthEWpa0Rrv6jDEgS48DWYgLoybVnXZSs20P-tuftW3FHcudMJu3gZf~B64bnqQTivmAaNVPSvz~a~x6ndTnijnXeblXGmPWtKA__'
  @ContentChild('text2')
  text2: TemplateRef<any>
  @Input()
  imageAlt: string = 'image'
  @ContentChild('text')
  text: TemplateRef<any>
  constructor() {}
}
