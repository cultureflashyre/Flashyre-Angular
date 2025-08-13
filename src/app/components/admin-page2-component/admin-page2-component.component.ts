import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'admin-page2-component',
  templateUrl: 'admin-page2-component.component.html',
  styleUrls: ['admin-page2-component.component.css'],
})
export class AdminPage2Component {
  @ContentChild('text2')
  text2: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('button')
  button: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  constructor() {}
}
