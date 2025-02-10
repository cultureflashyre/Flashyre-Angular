import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'flashyre-navbar',
  templateUrl: 'flashyre-navbar.component.html',
  styleUrls: ['flashyre-navbar.component.css'],
})
export class FlashyreNavbar {
  @ContentChild('text121')
  text121: TemplateRef<any>
  @ContentChild('text122')
  text122: TemplateRef<any>
  @Input()
  imageAlt3: string = 'image'
  @Input()
  rootClassName: string = ''
  @Input()
  imageSrc3: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png'
  @ContentChild('text123')
  text123: TemplateRef<any>
  @ContentChild('text12')
  text12: TemplateRef<any>
  @ContentChild('text1231')
  text1231: TemplateRef<any>
  constructor() {}
}
