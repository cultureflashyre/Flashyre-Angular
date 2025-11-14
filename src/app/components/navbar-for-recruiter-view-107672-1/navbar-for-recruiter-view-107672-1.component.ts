import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'navbar-for-recruiter-view1076721',
    templateUrl: 'navbar-for-recruiter-view-107672-1.component.html',
    styleUrls: ['navbar-for-recruiter-view-107672-1.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet],
})
export class NavbarForRecruiterView1076721 {
  @ContentChild('text3')
  text3: TemplateRef<any>
  @ContentChild('text112')
  text112: TemplateRef<any>
  @ContentChild('button')
  button: TemplateRef<any>
  @ContentChild('text111')
  text111: TemplateRef<any>
  @ContentChild('text12')
  text12: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text4')
  text4: TemplateRef<any>
  @ContentChild('button2')
  button2: TemplateRef<any>
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text13')
  text13: TemplateRef<any>
  constructor() {}
}
