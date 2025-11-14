import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'signup-college1',
    templateUrl: 'signup-college1.component.html',
    styleUrls: ['signup-college1.component.css'],
    standalone: true,
    imports: [
        NgClass,
        NgTemplateOutlet,
        FormsModule,
    ],
})
export class SignupCollege1 {
  @ContentChild('text6')
  text6: TemplateRef<any>
  @ContentChild('text121')
  text121: TemplateRef<any>
  @ContentChild('text11')
  text11: TemplateRef<any>
  @ContentChild('text12')
  text12: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text1111')
  text1111: TemplateRef<any>
  @ContentChild('text112')
  text112: TemplateRef<any>
  @ContentChild('button')
  button: TemplateRef<any>
  @ContentChild('heading')
  heading: TemplateRef<any>
  @ContentChild('text111')
  text111: TemplateRef<any>
  @ContentChild('text21')
  text21: TemplateRef<any>
  @ContentChild('text71')
  text71: TemplateRef<any>
  @ContentChild('text5')
  text5: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text22')
  text22: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  constructor() {}
}
