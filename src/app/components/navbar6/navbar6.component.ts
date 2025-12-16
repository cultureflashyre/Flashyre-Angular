import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgIf, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'app-navbar6',
    templateUrl: 'navbar6.component.html',
    styleUrls: ['navbar6.component.css'],
    standalone: true,
    imports: [NgIf, NgTemplateOutlet],
})
export class Navbar6 {
  @ContentChild('page1')
  page1: TemplateRef<any>
  @Input()
  link4Url: string = 'https://www.teleporthq.io'
  @ContentChild('page4Description')
  page4Description: TemplateRef<any>
  @Input()
  linkUrlPage4: string = 'https://www.teleporthq.io'
  @Input()
  linkUrlPage1: string = 'https://www.teleporthq.io'
  @Input()
  logoSrc: string =
    'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/84ec08e8-34e9-42c7-9445-d2806d156403/fac575ac-7a41-484f-b7ac-875042de11f8?org_if_sml=1&force_format=original'
  @ContentChild('link2')
  link2: TemplateRef<any>
  @ContentChild('page2')
  page2: TemplateRef<any>
  @Input()
  page4ImageSrc: string =
    'https://images.unsplash.com/photo-1612215670548-612dd2de09ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjc0NTUyNHw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('link1')
  link1: TemplateRef<any>
  @Input()
  link2Url: string = 'https://www.teleporthq.io'
  @Input()
  linkUrlPage2: string = 'https://www.teleporthq.io'
  @Input()
  page1ImageSrc: string =
    'https://images.unsplash.com/photo-1715148532951-b1247b93f671?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjc0NTUyNXw&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  page2ImageAlt: string = 'image'
  @ContentChild('link3')
  link3: TemplateRef<any>
  @Input()
  logoAlt: string = 'Company Logo'
  @ContentChild('page1Description')
  page1Description: TemplateRef<any>
  @Input()
  linkUrlPage3: string = 'https://www.teleporthq.io'
  @Input()
  page4ImageAlt: string = 'image'
  @ContentChild('link5')
  link5: TemplateRef<any>
  @ContentChild('page2Description')
  page2Description: TemplateRef<any>
  @Input()
  link1Url: string = 'https://www.teleporthq.io'
  @Input()
  page1ImageAlt: string = 'image'
  @ContentChild('page4')
  page4: TemplateRef<any>
  @ContentChild('page3')
  page3: TemplateRef<any>
  @Input()
  page2ImageSrc: string =
    'https://images.unsplash.com/photo-1538566855791-4bf61c09bade?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjc0NTUyNXw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('page3Description')
  page3Description: TemplateRef<any>
  @Input()
  page3ImageAlt: string = 'image'
  @Input()
  link3Url: string = 'https://www.teleporthq.io'
  @Input()
  page3ImageSrc: string =
    'https://images.unsplash.com/photo-1643845892686-30c241c3938c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjc0NTUyNHw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('link4')
  link4: TemplateRef<any>
  link5AccordionOpen: boolean = false
  link5DropdownVisible: boolean = false
  constructor() {}
}
