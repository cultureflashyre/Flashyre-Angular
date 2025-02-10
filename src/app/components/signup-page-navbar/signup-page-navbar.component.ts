import { Component, Input } from '@angular/core'

@Component({
  selector: 'signup-page-navbar',
  templateUrl: 'signup-page-navbar.component.html',
  styleUrls: ['signup-page-navbar.component.css'],
})
export class SignupPageNavbar {
  @Input()
  imageSrc1: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png'
  @Input()
  imageAlt1: string = 'image'
  @Input()
  rootClassName: string = ''
  constructor() {}
}
