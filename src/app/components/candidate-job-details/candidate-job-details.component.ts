import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'candidate-job-details',
  templateUrl: 'candidate-job-details.component.html',
  styleUrls: ['candidate-job-details.component.css'],
})
export class CandidateJobDetails {
  @ContentChild('button')
  button: TemplateRef<any>
  @ContentChild('button1')
  button1: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @Input()
  imageSrc1: string =
    '/assets/Icons/corporate_fare_100dp_e3e3e3_fill0_wght400_grad0_opsz48-200h.png'
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @Input()
  imageAlt1: string = 'image'
  @ContentChild('text3')
  text3: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  constructor() {}
}
