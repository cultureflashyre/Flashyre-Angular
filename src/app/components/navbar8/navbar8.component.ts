import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgTemplateOutlet, NgIf } from '@angular/common';

@Component({
    selector: 'app-navbar8',
    templateUrl: 'navbar8.component.html',
    styleUrls: ['navbar8.component.css'],
    standalone: true,
    imports: [NgTemplateOutlet, NgIf],
})
export class Navbar8 {
  @ContentChild('page2Description')
  page2Description: TemplateRef<any>
  @Input()
  link2Url: string = 'https://www.teleporthq.io'
  @ContentChild('link4')
  link4: TemplateRef<any>
  @Input()
  page2ImageAlt: string = 'About Image'
  @Input()
  page4ImageSrc: string =
    'https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3Mnw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('page4Description')
  page4Description: TemplateRef<any>
  @Input()
  link3Url: string = 'https://www.teleporthq.io'
  @ContentChild('page1Description')
  page1Description: TemplateRef<any>
  @ContentChild('action1')
  action1: TemplateRef<any>
  @Input()
  linkUrlPage2: string = 'https://www.teleporthq.io'
  @ContentChild('page3')
  page3: TemplateRef<any>
  @Input()
  linkUrlPage1: string = 'https://www.teleporthq.io'
  @Input()
  page3ImageAlt: string = 'Contact Image'
  @Input()
  linkUrlPage3: string = 'https://www.teleporthq.io'
  @ContentChild('link1')
  link1: TemplateRef<any>
  @ContentChild('page1')
  page1: TemplateRef<any>
  @Input()
  page1ImageSrc: string =
    'https://images.unsplash.com/photo-1691302174364-1c03fda8dff3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3MXw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('action2')
  action2: TemplateRef<any>
  @Input()
  page1ImageAlt: string = 'Home Image'
  @Input()
  page4ImageAlt: string = 'FAQ Image'
  @Input()
  page2ImageSrc: string =
    'https://images.unsplash.com/photo-1709777858933-1b0133efc318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3Mnw&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  logoSrc: string =
    'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/84ec08e8-34e9-42c7-9445-d2806d156403/fac575ac-7a41-484f-b7ac-875042de11f8?org_if_sml=1&force_format=original'
  @ContentChild('link2')
  link2: TemplateRef<any>
  @Input()
  logoAlt: string = 'Company Logo'
  @ContentChild('page3Description')
  page3Description: TemplateRef<any>
  @ContentChild('page4')
  page4: TemplateRef<any>
  @ContentChild('link3')
  link3: TemplateRef<any>
  @ContentChild('page2')
  page2: TemplateRef<any>
  @Input()
  linkUrlPage4: string = 'https://www.teleporthq.io'
  @Input()
  page3ImageSrc: string =
    'https://images.unsplash.com/photo-1642724978334-218b27d2c472?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3Mnw&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  link1Url: string = 'https://www.teleporthq.io'
  link5DropdownVisible: boolean = false
  link5AccordionOpen: boolean = false
  constructor() {}
}
