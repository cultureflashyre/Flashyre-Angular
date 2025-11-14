import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'app-contact10',
    templateUrl: 'contact10.component.html',
    styleUrls: ['contact10.component.css'],
    standalone: true,
    imports: [NgTemplateOutlet],
})
export class Contact10 {
  @ContentChild('content1')
  content1: TemplateRef<any>
  @Input()
  location1ImageAlt: string = 'Email Icon'
  @Input()
  location1ImageSrc: string =
    'https://images.unsplash.com/photo-1603899122724-98440dd9c400?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3M3w&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  location2ImageAlt: string = 'Phone Icon'
  @ContentChild('heading1')
  heading1: TemplateRef<any>
  @ContentChild('location1')
  location1: TemplateRef<any>
  @ContentChild('location1Description')
  location1Description: TemplateRef<any>
  @ContentChild('location2Description')
  location2Description: TemplateRef<any>
  @Input()
  location2ImageSrc: string =
    'https://images.unsplash.com/photo-1592150053369-ed15a7f68b92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3Mnw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('location2')
  location2: TemplateRef<any>
  constructor() {}
}
