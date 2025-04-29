import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { AuthService } from '../../services/candidate.service'; // Candidate service
import { CorporateService } from '../../services/corporate.service'; // Corporate service

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
  @Input() signupLink: string = '/signup-candidate'; // Dynamic signup link
  @Input() loginType: string = 'candidate'; // Specify login type

  @Output() loginSubmit = new EventEmitter<{ email: string, password: string }>();

  email: string = '';
  password: string = '';
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private corporateService: CorporateService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['errorMessage']) {
      console.log('Error Message Updated:', this.errorMessage);
    }
    if (changes['signupLink']) {
      console.log('Signup Link Updated:', this.signupLink);
    }
 
  }

  onSubmit() {
    if (this.email && this.password) {
      const loginData = { email: this.email, password: this.password };
      const service = this.loginType === 'corporate' ? this.corporateService : this.authService;
      console.log('Using service for loginType:', this.loginType); // Debug log

      service.login(this.email, this.password).subscribe({
        next: (response: any) => {
          if (response.message === 'Login successful') {
            this.errorMessage = ''; // Clear error message
            localStorage.setItem('jwtToken', response.access);
            this.loginSubmit.emit(loginData);
            console.log('Login successful:', response);
          }
        },
        error: (err) => {
          // Handle Django error response: {"error": {...}}
          let errorMsg = 'Invalid Email or Password';
          if (err.error && err.error.error) {
            // Handle nested error object
            errorMsg = typeof err.error.error === 'string' ? err.error.error : JSON.stringify(err.error.error);
          }
          this.errorMessage = errorMsg;
          console.error('Login failed:', err);
        }
      });
    } else {
      this.errorMessage = 'Please enter both email and password';
    }
  }

  onEmailChange() {
    if (this.email && this.password) {
      this.errorMessage = ''; // Clear message when both fields are filled
    } else if (!this.email && !this.password) {
      this.errorMessage = ''; // Clear message when both fields are empty
    } else {
      this.errorMessage = 'Please enter both email and password';
    }
  }

  onPasswordChange() {
    if (this.email && this.password) {
      this.errorMessage = ''; // Clear message when both fields are filled
    } else if (!this.email && !this.password) {
      this.errorMessage = ''; // Clear message when both fields are empty
    } else {
      this.errorMessage = 'Please enter both email and password';
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}