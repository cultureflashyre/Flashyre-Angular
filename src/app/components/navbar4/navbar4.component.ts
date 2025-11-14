import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'app-navbar4',
    templateUrl: 'navbar4.component.html',
    styleUrls: ['navbar4.component.css'],
    standalone: true,
    imports: [NgTemplateOutlet],
})
export class Navbar4 {
  @ContentChild('link3')
  link3: TemplateRef<any>
  @Input()
  link1Url: string = 'https://www.teleporthq.io'
  @ContentChild('link2')
  link2: TemplateRef<any>
  @Input()
  logoAlt: string = 'Company Logo'
  @ContentChild('action1')
  action1: TemplateRef<any>
  @ContentChild('link1')
  link1: TemplateRef<any>
  @ContentChild('link5')
  link5: TemplateRef<any>
  @Input()
  link2Url: string = 'https://www.teleporthq.io'
  @ContentChild('action2')
  action2: TemplateRef<any>
  @Input()
  link5Url: string = 'https://www.teleporthq.io'
  @ContentChild('link4')
  link4: TemplateRef<any>
  @Input()
  logoSrc: string =
    'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/84ec08e8-34e9-42c7-9445-d2806d156403/fac575ac-7a41-484f-b7ac-875042de11f8?org_if_sml=1&force_format=original'
  @Input()
  link3Url: string = 'https://www.teleporthq.io'
  @Input()
  link4Url: string = 'https://www.teleporthq.io'
  constructor() {}
}
