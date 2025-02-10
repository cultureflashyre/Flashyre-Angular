import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'profile-basicinformation-component',
  templateUrl: 'profile-basicinformation-component.component.html',
  styleUrls: ['profile-basicinformation-component.component.css'],
})
export class ProfileBasicinformationComponent {
  @Input()
  textinputPlaceholder32: string = 'Enter your email'
  @Input()
  imageSrc: string =
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDIwfHxnaXJsfGVufDB8fHx8MTczNDA4MzI2NHww&ixlib=rb-4.0.3&w=200'
  @Input()
  textinputPlaceholder4: string = 'Enter First name'
  @Input()
  textinputPlaceholder: string = 'Upload Resume'
  @ContentChild('text2')
  text2: TemplateRef<any>
  @Input()
  textinputPlaceholder31: string = 'Enter Mobile Number'
  @Input()
  imageAlt: string = 'image'
  @ContentChild('text6')
  text6: TemplateRef<any>
  @Input()
  textinputPlaceholder3: string = 'Enter Last Name'
  @Input()
  rootClassName: string = ''
  @ContentChild('button')
  button: TemplateRef<any>
  @ContentChild('text52')
  text52: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text51')
  text51: TemplateRef<any>
  @ContentChild('text5')
  text5: TemplateRef<any>
  constructor() {}
}
