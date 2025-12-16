import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'candidate-view-last-page-card',
    templateUrl: 'candidate-view-last-page-card.component.html',
    styleUrls: ['candidate-view-last-page-card.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet],
})
export class CandidateViewLastPageCard {
  @Input()
  imageAlt: string = 'image'
  @ContentChild('text2')
  text2: TemplateRef<any>
  @Input()
  imageSrc: string =
    'https://s3-alpha-sig.figma.com/img/cb33/d035/72e938963245d419674c3c2e71065794?Expires=1737936000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=q4HKhJijWG7gIkWWgF~7yllDZKHyqxALVLh-VKU~aa6mkzu0y4GObeMz7kg6Kmk7a9iOIYXqqp-qRBeuRSILqUH9s6N-q5DphgEKuOnEvvcwSUbZEvVBqcrwkg6txq3COMJFK7Sm2Gvb8~Q1EmKXJBhingSOoVxYxsnvL9v6V-y9pb6Lz9e82VXGr46k8A~USzriFdWvRPCJyrJODdI42GV-p1WeEQ8fmemtUfuNNEP5fFOc~94zGAaHwf3rqDl~WWm5r5QbxvCnvNpT5QjNAOCOAdBIE-V0~0Lepa2iIQ-h9fT9sARy6sZlJpJWG7cxgqSaAQjS9liz8s1JrjXOgw__'
  @Input()
  rootClassName: string = ''
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  constructor() {}
}
