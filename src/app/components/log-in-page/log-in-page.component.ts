import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { AuthService } from '../../services/candidate.service'; // Adjust path if needed

@Component({
  selector: 'log-in-page',
  templateUrl: 'log-in-page.component.html',
  styleUrls: ['log-in-page.component.css'],
})
export class LogInPage implements OnChanges {
  @ContentChild('text11') text11: TemplateRef<any>;
  @ContentChild('text4') text4: TemplateRef<any>;
  @ContentChild('text71') text71: TemplateRef<any>;
  @ContentChild('text1') text1: TemplateRef<any>;
  @ContentChild('text3') text3: TemplateRef<any>;
  @ContentChild('heading') heading: TemplateRef<any>;
  @ContentChild('forgotPassword') forgotPassword: TemplateRef<any>;
  @ContentChild('button') button: TemplateRef<any>;
  @ContentChild('text2') text2: TemplateRef<any>;

  @Input() textinputPlaceholder1: string = 'Enter Password';
  @Input() textinputPlaceholder: string = 'Enter your email';
  @Input() rootClassName: string = '';
  @Input() errorMessage: string = '';

  @Output() loginSubmit = new EventEmitter<{ email: string, password: string }>();

  email: string = '';
  password: string = '';
  showPassword: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['errorMessage']) {
      console.log('Error Message Updated:', this.errorMessage);
    }
  }

  onSubmit() {
    if (this.email && this.password) {
      const loginData = { email: this.email, password: this.password };

      this.authService.login(this.email, this.password).subscribe({
        next: (response: any) => {
          if (response.message === 'Login successful') {
            this.errorMessage = ''; // Clear error message on success
            localStorage.setItem('jwtToken', response.access);
            this.loginSubmit.emit(loginData);
            console.log('Login successful:', response);
          }
        },
        error: (err) => {
          this.errorMessage = err.error.error || 'Invalid Email or Password'; // Set to backend error or default
          console.error('Login failed:', err);
        }
      });
    } else {
      this.errorMessage = 'Please enter both email and password'; // Set when fields are empty
    }
  }

  // Handle email input change
  onEmailChange() {
    if (!this.email || !this.password) {
      this.errorMessage = this.email || this.password ? 'Please enter both email and password' : '';
    }
  }

  // Handle password input change
  onPasswordChange() {
    if (!this.email || !this.password) {
      this.errorMessage = this.email || this.password ? 'Please enter both email and password' : '';
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}