import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'navbar-for-candidate-view86072',
    templateUrl: 'navbar-for-candidate-view-86072.component.html',
    styleUrls: ['navbar-for-candidate-view-86072.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet],
})
export class NavbarForCandidateView86072 {
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text112')
  text112: TemplateRef<any>
  @ContentChild('button2')
  button2: TemplateRef<any>
  @ContentChild('text13')
  text13: TemplateRef<any>
  @ContentChild('button1')
  button1: TemplateRef<any>
  @ContentChild('button')
  button: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text12')
  text12: TemplateRef<any>
  @ContentChild('text111')
  text111: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @ContentChild('text4')
  text4: TemplateRef<any>
  @ContentChild('button11')
  button11: TemplateRef<any>
  constructor() {}
}
