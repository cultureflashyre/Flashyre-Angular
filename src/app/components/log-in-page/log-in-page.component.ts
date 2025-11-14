import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/candidate.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { catchError, of } from 'rxjs';
import { SocialAuthService, GoogleLoginProvider,SocialUser, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { AlertMessageComponent } from '../alert-message/alert-message.component';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'log-in-page',
    templateUrl: './log-in-page.component.html',
    styleUrls: ['./log-in-page.component.css'],
    standalone: true,
    imports: [
      AlertMessageComponent, NgClass, 
      NgTemplateOutlet, FormsModule, 
      ReactiveFormsModule, RouterLink,
    GoogleSigninButtonModule ,]
})
export class LogInPage implements OnInit {
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
  @Input() userType: string = 'candidate';

  @Output() loginSubmit = new EventEmitter<any>();

  loginForm: FormGroup;
  showPassword: boolean = false;
  errorMessage: string = '';

    // Properties for the alert message
  showLoginSuccessAlert = false;
  loginSuccessMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private corporateAuthService: CorporateAuthService,
    private cdr: ChangeDetectorRef,
    private socialAuthService: SocialAuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(15)]]
    });
  }

  ngOnInit() {
    console.log('LogInPage component initialized');
    // Clear error message when user types in the form
    this.loginForm.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        console.log('Clearing error message due to form input');
        this.errorMessage = '';
        this.cdr.detectChanges();
      }
    }); 
    // --- ADDED: Google Sign-In Subscription Logic ---
    // This is the new, correct way to handle Google Sign-In.
    // It listens for a successful login from the <asl-google-signin-button> component
    // in your HTML and then executes our logic.
    this.socialAuthService.authState.subscribe((socialUser: SocialUser) => {
      console.log('Google user authenticated:', socialUser);
      const idToken = socialUser.idToken;

      const authObservable = this.userType === 'corporate'
        ? this.corporateAuthService.googleAuthCheck(idToken)
        : this.authService.googleAuthCheck(idToken);

      authObservable.subscribe({
        next: (response) => {
          if (response.status === 'LOGIN_SUCCESS') {
            this.errorMessage = '';
            // The backend returns a full login response, so we emit it
            // to the parent component (login-candidate.component).
            this.loginSubmit.emit(response);
          } else {
            // This happens if a new user (not in your DB) tries to log in.
            this.errorMessage = 'Account not found. Please sign up first.';
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Google login failed. Please try again.';
          this.cdr.detectChanges();
        }
      });
    });
  }

  onSubmit() {
    console.log('onSubmit called', {
      formValues: this.loginForm.value,
      isValid: this.loginForm.valid,
    });

    if (this.loginForm.invalid) {
      this.errorMessage = 'Please enter both email and password';
      this.cdr.detectChanges();
      return;
    }

    const { email, password } = this.loginForm.value;
    const loginObservable = this.userType === 'corporate'
      ? this.corporateAuthService.loginCorporate(email, password)
      : this.authService.login(email, password);

    loginObservable.subscribe({
      next: (response: any) => {
        if (response.message === 'Login successful' && response.access) {
          this.errorMessage = '';
          localStorage.setItem('jwtToken', response.access);

          let roleMessage = '';
          switch (response.role) {
            case 'candidate':
              roleMessage = 'You are logged in as Candidate.';
              break;
            case 'recruiter':
              roleMessage = 'You are logged in as Recruiter.';
              break;
            case 'admin':
              roleMessage = 'You are logged in as Admin.';
              break;
            default:
              roleMessage = 'Login successful.';
              break;
          }
          this.loginSuccessMessage = roleMessage;
          this.showLoginSuccessAlert = true;
          this.cdr.detectChanges(); // Immediately show the alert message

          // Set a timeout to hide the message and then emit the login event
          setTimeout(() => {
            this.showLoginSuccessAlert = false;
            // --- MOVE THE EMIT CALL HERE ---
            this.loginSubmit.emit(response);
            this.cdr.detectChanges(); // Update the view after hiding the alert
          }, 5000); // 5-second delay

        } else {
          this.errorMessage = response.error || 'Invalid Email or Password';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.errorMessage = 'Invalid Email or Password';
        this.cdr.detectChanges();
      }
    });
  }

    // Function to close the alert manually if needed
  onAlertClose() {
    this.showLoginSuccessAlert = false;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.cdr.detectChanges();
  }
}