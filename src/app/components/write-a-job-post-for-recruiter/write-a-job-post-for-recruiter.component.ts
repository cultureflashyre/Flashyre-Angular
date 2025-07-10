import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'write-a-job-post-for-recruiter',
  templateUrl: 'write-a-job-post-for-recruiter.component.html',
  styleUrls: ['write-a-job-post-for-recruiter.component.css'],
})
export class WriteAJobPostForRecruiter {
  @Input()
  textinputPlaceholder1: string = 'Write...'
  @Input()
  imageSrc: string =
    'https://s3-alpha-sig.figma.com/img/7583/57be/ae9594f1160471db992db1cf36ca3f46?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=Dz8dIqBZgAN6OA9emoE1oyRIJlEeG6R5Z0hGAat48dUObXcCtfA1D4ng-E~4BXUupiiukPIV6IHb1XIjbxSRKPPB7JdqIwbz7qr6Z4P3LLJslbmQXpJ1-jAUtAOMhTHFY7KvnZYVn-YnXHLXpYqWehaULDEqJ4bx6O2VZ44Yc5NkyheBlF6~DTXR5qlGQbN1vR1lLaG5aRLtZRib0clt4-cqX3geDNsfmeIt8VvtcVAGcsJkMC-Mc5Fa4ovWMO-z7TQX7slZdttMTBa-KPd42DXGEs4evg8bScepEOlfni1PVp4hni0HtZRMEgVaToD~ap4~~OckKnXSTRxhwQ5-WA__'
  @Input()
  rootClassName: string = ''
  @ContentChild('text11')
  text11: TemplateRef<any>
  @ContentChild('text5')
  text5: TemplateRef<any>
  @ContentChild('button4')
  button4: TemplateRef<any>
  @Input()
  imageAlt: string = 'image'
  @ContentChild('text113')
  text113: TemplateRef<any>
  constructor() {}
}
