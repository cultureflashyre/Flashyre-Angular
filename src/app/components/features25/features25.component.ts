import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'app-features25',
  templateUrl: 'features25.component.html',
  styleUrls: ['features25.component.css'],
})
export class Features25 {
  @Input()
  feature2ImgAlt: string = 'Image showing user-friendly navigation'
  @ContentChild('feature1Description')
  feature1Description: TemplateRef<any>
  @ContentChild('feature3Description')
  feature3Description: TemplateRef<any>
  @Input()
  feature1ImgAlt: string = 'Image depicting easy data input'
  @Input()
  feature2ImgSrc: string =
    'https://images.unsplash.com/photo-1577351594944-a5586c757d8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3Mnw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('feature1Title')
  feature1Title: TemplateRef<any>
  @Input()
  feature1ImgSrc: string =
    'https://images.unsplash.com/photo-1592150053369-ed15a7f68b92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3MXw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('feature3Title')
  feature3Title: TemplateRef<any>
  @ContentChild('feature2Title')
  feature2Title: TemplateRef<any>
  @Input()
  feature3ImgAlt: string = 'Image symbolizing secure information handling'
  @Input()
  feature3ImgSrc: string =
    'https://images.unsplash.com/photo-1678227547314-b5b1ab58e35b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3Mnw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('feature2Description')
  feature2Description: TemplateRef<any>
  activeTab: number = 0
  constructor() {}
}
