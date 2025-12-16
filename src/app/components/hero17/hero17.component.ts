import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common';
import { DangerousHtmlComponent } from '../dangerous-html/dangerous-html.component';
@Component({
    selector: 'app-hero17',
    templateUrl: 'hero17.component.html',
    styleUrls: ['hero17.component.css'],
    standalone: true,
    imports: [NgTemplateOutlet, DangerousHtmlComponent,],
})
export class Hero17 {
  @Input()
  image9Src: string =
    'https://images.unsplash.com/photo-1484259147675-50b8c2f154da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3Nnw&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  image4Src: string =
    'https://images.unsplash.com/photo-1711045675408-cd2daf82521f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3N3w&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  image10Alt: string = 'Hero Image'
  @Input()
  image7Src: string =
    'https://images.unsplash.com/photo-1695654393711-93565df7dfc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3NHw&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  image11Alt: string = 'Hero Image'
  @Input()
  image12Src: string =
    'https://images.unsplash.com/photo-1611122261270-3171e87a5567?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3NXw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('content1')
  content1: TemplateRef<any>
  @Input()
  image7Alt: string = 'Hero Image'
  @Input()
  image1Src: string =
    'https://images.unsplash.com/photo-1646210188963-260f159b25a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3N3w&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  image6Alt: string = 'Hero Image'
  @Input()
  image12Alt: string = 'Hero Image'
  @Input()
  image11Src: string =
    'https://images.unsplash.com/photo-1658235081562-a7f50e7e05b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3NHw&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  image5Src: string =
    'https://images.unsplash.com/photo-1559815744-62d8c5e96f2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3Nnw&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  image1Alt: string = 'Certificate Portal Image'
  @Input()
  image2Alt: string = 'Hero Image'
  @ContentChild('heading1')
  heading1: TemplateRef<any>
  @Input()
  image4Alt: string = 'Hero Image'
  @Input()
  image8Src: string =
    'https://images.unsplash.com/photo-1712571674555-39feb3fa867e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3Nnw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('action1')
  action1: TemplateRef<any>
  @Input()
  image9Alt: string = 'Hero Image'
  @Input()
  image6Src: string =
    'https://images.unsplash.com/photo-1623053071809-80ed5bc65f2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3NXw&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  image3Alt: string = 'Hero Image'
  @Input()
  image2Src: string =
    'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3M3w&ixlib=rb-4.0.3&q=80&w=1080'
  @Input()
  image8Alt: string = 'Hero Image'
  @Input()
  image5Alt: string = 'Hero Image'
  @Input()
  image3Src: string =
    'https://images.unsplash.com/photo-1646007086640-726b66676226?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3Mnw&ixlib=rb-4.0.3&q=80&w=1080'
  @ContentChild('action2')
  action2: TemplateRef<any>
  @Input()
  image10Src: string =
    'https://images.unsplash.com/photo-1578004952479-cbd8b148f018?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTczNjI0Nzg3N3w&ixlib=rb-4.0.3&q=80&w=1080'
  constructor() {}
}
