import { Component, Input } from '@angular/core'
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'signup-page-navbar',
    templateUrl: 'signup-page-navbar.component.html',
    styleUrls: ['signup-page-navbar.component.css'],
    standalone: true,
    imports: [NgClass, RouterLink],
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
