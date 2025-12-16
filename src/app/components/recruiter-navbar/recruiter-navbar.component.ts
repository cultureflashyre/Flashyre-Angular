import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'recruiter-navbar',
    templateUrl: 'recruiter-navbar.component.html',
    styleUrls: ['recruiter-navbar.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet],
})
export class RecruiterNavbar {
  @ContentChild('text8')
  text8: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text4')
  text4: TemplateRef<any>
  @ContentChild('text7')
  text7: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @ContentChild('text6')
  text6: TemplateRef<any>
  @ContentChild('text9')
  text9: TemplateRef<any>
  @ContentChild('text5')
  text5: TemplateRef<any>
  constructor() {}
}
