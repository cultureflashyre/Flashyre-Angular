import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'landin-page-testimonial-card',
    templateUrl: 'landin-page-testimonial-card.component.html',
    styleUrls: ['landin-page-testimonial-card.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet],
})
export class LandinPageTestimonialCard {
  @ContentChild('heading')
  heading: TemplateRef<any>
  @Input()
  imageAlt: string = 'image'
  @ContentChild('text')
  text: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text1')
  text1: TemplateRef<any>
  @Input()
  imageSrc: string =
    'https://images.unsplash.com/photo-1595687825617-10c4d36566e7?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDUwfHxpbmRpYW4lMjBsYWR5fGVufDB8fHx8MTczNDI2NDYwMXww&ixlib=rb-4.0.3&w=200'
  @ContentChild('text2')
  text2: TemplateRef<any>
  constructor() {}
}
