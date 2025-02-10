import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'app-testimonial17',
  templateUrl: 'testimonial17.component.html',
  styleUrls: ['testimonial17.component.css'],
})
export class Testimonial17 {
  @ContentChild('review3')
  review3: TemplateRef<any>
  @ContentChild('review1')
  review1: TemplateRef<any>
  @Input()
  author1Alt: string = 'Image of John Doe'
  @Input()
  author2Alt: string = 'Image of Jane Smith'
  @ContentChild('author3Name')
  author3Name: TemplateRef<any>
  @ContentChild('author2Name')
  author2Name: TemplateRef<any>
  @Input()
  author1Src: string =
    'https://images.unsplash.com/photo-1679310446454-f94b53167675?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3MXw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('content1')
  content1: TemplateRef<any>
  @ContentChild('author4Name')
  author4Name: TemplateRef<any>
  @ContentChild('author3Position')
  author3Position: TemplateRef<any>
  @Input()
  author3Alt: string = 'Image of David Johnson'
  @Input()
  author4Src: string =
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3Mnw&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  author2Src: string =
    'https://images.unsplash.com/photo-1472521882609-05fb39814d60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3Mnw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('heading1')
  heading1: TemplateRef<any>
  @ContentChild('author1Position')
  author1Position: TemplateRef<any>
  @ContentChild('author1Name')
  author1Name: TemplateRef<any>
  @Input()
  author3Src: string =
    'https://images.unsplash.com/photo-1524453160716-7de8c376a01d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3Mnw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('author4Position')
  author4Position: TemplateRef<any>
  @ContentChild('review2')
  review2: TemplateRef<any>
  @ContentChild('review4')
  review4: TemplateRef<any>
  @ContentChild('author2Position')
  author2Position: TemplateRef<any>
  @Input()
  author4Alt: string = 'Image of Sarah Williams'
  constructor() {}
}
