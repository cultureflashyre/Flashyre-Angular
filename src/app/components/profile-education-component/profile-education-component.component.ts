import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'profile-education-component',
  templateUrl: 'profile-education-component.component.html',
  styleUrls: ['profile-education-component.component.css'],
})
export class ProfileEducationComponent {
  @ContentChild('text3136')
  text3136: TemplateRef<any>
  @ContentChild('text313')
  text313: TemplateRef<any>
  @ContentChild('text3137')
  text3137: TemplateRef<any>
  @ContentChild('text1112')
  text1112: TemplateRef<any>
  @ContentChild('text111')
  text111: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text112')
  text112: TemplateRef<any>
  @ContentChild('text3132')
  text3132: TemplateRef<any>
  @ContentChild('text3131')
  text3131: TemplateRef<any>
  @ContentChild('text314')
  text314: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text1111')
  text1111: TemplateRef<any>
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  constructor() {}
}
