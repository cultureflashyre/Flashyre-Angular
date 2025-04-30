import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/candidate.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';

@Component({
  selector: 'log-in-page',
  templateUrl: './log-in-page.component.html',
  styleUrls: ['./log-in-page.component.css']
})
export class LogInPage {
  @ContentChild('text11') text11: TemplateRef<any>;
  @ContentChild('text4') text4: TemplateRef<any>;
  @ContentChild('text1') text1: TemplateRef<any>;
  @ContentChild('text3') text3: TemplateRef<any>;
  @ContentChild('heading') heading: TemplateRef<any>;
  @ContentChild('forgotPassword') forgotPassword: TemplateRef<any>;
  @ContentChild('button') button: TemplateRef<any>;

  @Input() textinputPlaceholder1: string = 'Enter Password';
  @Input() textinputPlaceholder: string = 'Enter your email';
  @Input() rootClassName: string = '';
  @Input() userType: string = 'candidate'; // New input to specify user type

  @Output() loginSubmit = new EventEmitter<any>();

  loginForm: FormGroup;
  showPassword: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private corporateAuthService: CorporateAuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      const loginObservable = this.userType === 'corporate'
        ? this.corporateAuthService.loginCorporate(email, password)
        : this.authService.login(email, password);

      loginObservable.subscribe({
        next: (response: any) => {
          this.errorMessage = '';
          localStorage.setItem('jwtToken', response.access);
          this.loginSubmit.emit(response);
          console.log(`${this.userType} login successful:`, response);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Invalid Email or Password';
          console.error(`${this.userType} login failed:`, err);
        }
      });
    } else {
      this.errorMessage = 'Please enter both email and password';
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}