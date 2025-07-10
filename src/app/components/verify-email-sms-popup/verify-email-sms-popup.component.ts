import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'verify-email-sms-popup',
  templateUrl: 'verify-email-sms-popup.component.html',
  styleUrls: ['verify-email-sms-popup.component.css'],
})
export class VerifyEmailSMSPopup {
  @Input()
  textinputPlaceholder: string = 'Enter Email OTP'
  @Input()
  textinputPlaceholder1: string = 'Enter Mobile number'
  @Input()
  rootClassName: string = ''
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('button')
  button: TemplateRef<any>
  @ContentChild('text')
  text: TemplateRef<any>
  @Input()
  textinputPlaceholder2: string = 'Enter Phone OTP'
  constructor() {}
}
