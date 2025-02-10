import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'profile-certifications-component',
  templateUrl: 'profile-certifications-component.component.html',
  styleUrls: ['profile-certifications-component.component.css'],
})
export class ProfileCertificationsComponent {
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('text312')
  text312: TemplateRef<any>
  @ContentChild('text1111')
  text1111: TemplateRef<any>
  @ContentChild('text311')
  text311: TemplateRef<any>
  @ContentChild('text1121')
  text1121: TemplateRef<any>
  @ContentChild('text3121')
  text3121: TemplateRef<any>
  @ContentChild('text11')
  text11: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text112')
  text112: TemplateRef<any>
  @ContentChild('text111')
  text111: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text31')
  text31: TemplateRef<any>
  @ContentChild('text3111')
  text3111: TemplateRef<any>
  constructor() {}
}
