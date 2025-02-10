import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'app-gallery3',
  templateUrl: 'gallery3.component.html',
  styleUrls: ['gallery3.component.css'],
})
export class Gallery3 {
  @Input()
  image5Alt: string = 'Sculpture Installation'
  @Input()
  image6Src: string =
    'https://images.unsplash.com/photo-1537402006484-b0b4d22e5d83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNDYwMDUxMnw&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  image3Src: string =
    'https://images.unsplash.com/photo-1730954876008-6659b12ae5ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNDYwMDUwOXw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('content1')
  content1: TemplateRef<any>
  @Input()
  image4Alt: string = 'Cityscape Drawing'
  @Input()
  image2Src: string =
    'https://images.unsplash.com/photo-1732304721332-e3a5a6f74c19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNDYwMDUxMXw&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  image5Src: string =
    'https://images.unsplash.com/photo-1532134358497-43fa3c6a02b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNDYwMDUxMHw&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  image8Src: string =
    'https://images.unsplash.com/photo-1715857435850-100988e39122?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNDYwMDUxMXw&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  image1Alt: string = 'Abstract Artwork'
  @Input()
  image7Alt: string = 'Nature Photography'
  @ContentChild('heading1')
  heading1: TemplateRef<any>
  @Input()
  image1Src: string =
    'https://images.unsplash.com/photo-1591457217849-d6ec46eceb76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNDYwMDUwOXw&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  image3Alt: string = 'Portrait Painting'
  @Input()
  image2Alt: string = 'Landscape Photography'
  @Input()
  image6Alt: string = 'Street Art Mural'
  @Input()
  image8Alt: string = 'Architecture Sketch'
  @Input()
  image7Src: string =
    'https://images.unsplash.com/photo-1712571678060-496a9384720b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNDYwMDUxMHw&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  image4Src: string =
    'https://images.unsplash.com/photo-1695654403063-31f6671e2534?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNDYwMDUxMnw&ixlib=rb-4.0.3&q=80&w=1080'
  constructor() {}
}
