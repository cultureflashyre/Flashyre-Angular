import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'navbar-for-candidate-view860721',
  templateUrl: 'navbar-for-candidate-view-86072-1.component.html',
  styleUrls: ['navbar-for-candidate-view-86072-1.component.css'],
})
export class NavbarForCandidateView860721 {
  @ContentChild('text112')
  text112: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @ContentChild('text111')
  text111: TemplateRef<any>
  @ContentChild('text4')
  text4: TemplateRef<any>
  @ContentChild('button11')
  button11: TemplateRef<any>
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text13')
  text13: TemplateRef<any>
  @ContentChild('button')
  button: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('button2')
  button2: TemplateRef<any>
  @ContentChild('text12')
  text12: TemplateRef<any>
  constructor() {}
}
