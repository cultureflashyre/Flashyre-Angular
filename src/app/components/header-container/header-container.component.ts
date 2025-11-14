import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'header-container',
    templateUrl: 'header-container.component.html',
    styleUrls: ['header-container.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet],
})
export class HeaderContainer {
  @ContentChild('timer')
  timer: TemplateRef<any>
  @ContentChild('endTestText')
  endTestText: TemplateRef<any>
  @Input()
  logoSrc: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png'
  @Input()
  rootClassName: string = ''
  @Input()
  logoAlt: string = 'image'
  constructor() {}
}