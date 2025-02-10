import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'candidate-job-for-you-card1',
  templateUrl: 'candidate-job-for-you-card1.component.html',
  styleUrls: ['candidate-job-for-you-card1.component.css'],
})
export class CandidateJobForYouCard1 {
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('button')
  button: TemplateRef<any>
  @ContentChild('button1')
  button1: TemplateRef<any>
  @Input()
  imageSrc: string =
    'https://s3-alpha-sig.figma.com/img/cb33/d035/72e938963245d419674c3c2e71065794?Expires=1737936000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=q4HKhJijWG7gIkWWgF~7yllDZKHyqxALVLh-VKU~aa6mkzu0y4GObeMz7kg6Kmk7a9iOIYXqqp-qRBeuRSILqUH9s6N-q5DphgEKuOnEvvcwSUbZEvVBqcrwkg6txq3COMJFK7Sm2Gvb8~Q1EmKXJBhingSOoVxYxsnvL9v6V-y9pb6Lz9e82VXGr46k8A~USzriFdWvRPCJyrJODdI42GV-p1WeEQ8fmemtUfuNNEP5fFOc~94zGAaHwf3rqDl~WWm5r5QbxvCnvNpT5QjNAOCOAdBIE-V0~0Lepa2iIQ-h9fT9sARy6sZlJpJWG7cxgqSaAQjS9liz8s1JrjXOgw__'
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @Input()
  imageAlt: string = 'image'
  @ContentChild('text4')
  text4: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text1')
  text1: TemplateRef<any>
  constructor() {}
}
