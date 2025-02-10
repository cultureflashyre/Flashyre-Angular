import { Component, Input } from '@angular/core'

@Component({
  selector: 'login-page-navbar',
  templateUrl: 'login-page-navbar.component.html',
  styleUrls: ['login-page-navbar.component.css'],
})
export class LoginPageNavbar {
  @Input()
  imageSrc1: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png'
  @Input()
  imageAlt1: string = 'image'
  @Input()
  rootClassName: string = ''
  constructor() {}
}
