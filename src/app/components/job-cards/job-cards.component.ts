import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'job-cards',
  templateUrl: 'job-cards.component.html',
  styleUrls: ['job-cards.component.css'],
})
export class JobCards {
  @Input()
  rootClassName: string = ''
  @Input()
  imageAlt2: string = 'image'
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @Input()
  imageSrc2: string =
    '/assets/Icons/corporate_fare_100dp_e3e3e3_fill0_wght400_grad0_opsz48-200h.png'
  constructor() {}
}
