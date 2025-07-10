import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'app-navbar5',
  templateUrl: 'navbar5.component.html',
  styleUrls: ['navbar5.component.css'],
})
export class Navbar5 {
  @Input()
  link2Url: string = 'https://www.teleporthq.io'
  @Input()
  linkUrlPage4: string = 'https://www.teleporthq.io'
  @Input()
  linkUrlPage3: string = 'https://www.teleporthq.io'
  @Input()
  logoAlt: string = 'Website Logo'
  @ContentChild('link4')
  link4: TemplateRef<any>
  @ContentChild('page2')
  page2: TemplateRef<any>
  @ContentChild('page1')
  page1: TemplateRef<any>
  @ContentChild('link1')
  link1: TemplateRef<any>
  @ContentChild('link2')
  link2: TemplateRef<any>
  @ContentChild('page3')
  page3: TemplateRef<any>
  @Input()
  link3Url: string = 'https://www.teleporthq.io'
  @Input()
  linkUrlPage2: string = 'https://www.teleporthq.io'
  @Input()
  link1Url: string = 'https://www.teleporthq.io'
  @ContentChild('link3')
  link3: TemplateRef<any>
  @ContentChild('page4')
  page4: TemplateRef<any>
  @Input()
  linkUrlPage1: string = 'https://www.teleporthq.io'
  @Input()
  logoSrc: string =
    'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/84ec08e8-34e9-42c7-9445-d2806d156403/fac575ac-7a41-484f-b7ac-875042de11f8?org_if_sml=1&force_format=original'
  link5DropdownVisible: boolean = false
  link5AccordionOpen: boolean = false
  constructor() {}
}
