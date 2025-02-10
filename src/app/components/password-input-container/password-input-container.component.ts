import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'password-input-container',
  templateUrl: 'password-input-container.component.html',
  styleUrls: ['password-input-container.component.css'],
})
export class PasswordInputContainer {
  @Input()
  rootClassName: string = ''
  @ContentChild('text')
  text: TemplateRef<any>
  constructor() {}
}
