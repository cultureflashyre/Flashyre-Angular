import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'log-in-page',
  templateUrl: 'log-in-page.component.html',
  styleUrls: ['log-in-page.component.css'],
})
export class LogInPage {
  @ContentChild('text11') text11: TemplateRef<any>;
  @ContentChild('text4') text4: TemplateRef<any>;
  @ContentChild('text71') text71: TemplateRef<any>;
  @Input() textinputPlaceholder1: string = 'Enter Password';
  @Input() textinputPlaceholder: string = 'Enter your email';
  @ContentChild('text1') text1: TemplateRef<any>;
  @ContentChild('text3') text3: TemplateRef<any>;
  @ContentChild('heading') heading: TemplateRef<any>;
  @ContentChild('forgotPassword') forgotPassword: TemplateRef<any>;
  @Input() rootClassName: string = '';
  @ContentChild('button') button: TemplateRef<any>;
  @ContentChild('text2') text2: TemplateRef<any>;

  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  @Input() errorMessage: string = '';
  @Output() loginSubmit = new EventEmitter<{ email: string, password: string }>();

  constructor() {}

  onSubmit() {
    if (this.email && this.password) {
      this.loginSubmit.emit({ email: this.email, password: this.password });
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}