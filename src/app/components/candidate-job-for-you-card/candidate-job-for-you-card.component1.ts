import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'candidate-job-for-you-card1',
  templateUrl: 'candidate-job-for-you-card.component1.html',
  styleUrls: ['candidate-job-for-you-card.component1.css'],
})
export class CandidateJobForYouCard1 {
  @ContentChild('button')
  button: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @Input()
  imageSrc1: string =
    'https://s3-alpha-sig.figma.com/img/3667/fd08/188e527bc564e165889218d63e9ddb29?Expires=1737331200&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=dYoKsk5JhgAzTUdeGNuQyzY0jbMOeaRPoXyy~mw3veWOC7nW6l6H~epGSQ1m3I5J17iMtYj95cnY5irIXAl~FmP2L0Y-yQZk6mR7BbwAEQOXBtVKxy~uDg3mbzppncGDzj~gnEVjzMJdnbJ22By36v5gIAdrFnvEBPpvvCie8zl9kwkmXVQRLtv5Xfff6jwTNeIxsWS7KFuVyT3YM6vHXOk9ZJ6gW-ex2Q~UKqOZoDg5vtXiTTLYnDVXFEo2fxGtrZN0HsmEDcQ28D2hsM9Zm-34W6FKq~0E2AOBbvvSCcrbM95tW8BpE~L2wwpPqNj7Kbd1upee~qAg45eECT83HA__'
  @ContentChild('text6')
  text6: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @Input()
  imageAlt1: string = 'image'
  @ContentChild('text4')
  text4: TemplateRef<any>
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text5')
  text5: TemplateRef<any>
  @ContentChild('button1')
  button1: TemplateRef<any>
  constructor() {}
}
