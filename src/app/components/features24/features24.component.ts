import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'app-features24',
  templateUrl: 'features24.component.html',
  styleUrls: ['features24.component.css'],
})
export class Features24 {
  @ContentChild('feature2Description')
  feature2Description: TemplateRef<any>
  @Input()
  feature2ImgSrc: string =
    'https://images.unsplash.com/photo-1590310051055-1079d8f48c89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3M3w&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  feature3ImgSrc: string =
    'https://images.unsplash.com/photo-1695654687465-6b7940a9f03a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3MXw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('feature3Title')
  feature3Title: TemplateRef<any>
  @ContentChild('feature3Description')
  feature3Description: TemplateRef<any>
  @Input()
  feature1ImgAlt: string = 'Certificate Image'
  @ContentChild('feature2Title')
  feature2Title: TemplateRef<any>
  @ContentChild('feature1Description')
  feature1Description: TemplateRef<any>
  @ContentChild('feature1Title')
  feature1Title: TemplateRef<any>
  @Input()
  feature2ImgAlt: string = 'Navigation Icon'
  @Input()
  feature3ImgAlt: string = 'Certificate Icon'
  @Input()
  feature1ImgSrc: string =
    'https://images.unsplash.com/photo-1601342550031-d6df73676153?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3Mnw&ixlib=rb-4.0.3&q=80&w=1080'
  activeTab: number = 0
  constructor() {}
}
