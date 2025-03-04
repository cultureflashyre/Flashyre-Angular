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
  errorMessage: string = '';

  @Output() loginSubmit = new EventEmitter<{ email: string, password: string }>();

  constructor() {}

  onSubmit() {
    if (this.email && this.password) {
      // Basic email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailPattern.test(this.email)) {
        this.errorMessage = 'Please enter a valid email address';
        return;
      }

      // Here you would typically make an API call to verify credentials
      // For demonstration, let's simulate validation
      this.loginSubmit.emit({ email: this.email, password: this.password });
      
      const isValidCredentials = this.validateCredentials();
      
      if (!isValidCredentials) {
        this.errorMessage = 'Invalid email or password';
      } else {
        this.errorMessage = ''; // Clear error on success
      }
    } else {
      this.errorMessage = 'Please enter both email and password';
    }
  }

  // Example validation method - replace with your actual authentication logic
  private validateCredentials(): boolean {
    // This is just a placeholder - implement your actual validation
    // For demo purposes, let's say only specific credentials are valid
    return this.email === 'test@example.com' && this.password === 'password123';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}