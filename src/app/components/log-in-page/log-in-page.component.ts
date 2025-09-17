import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/candidate.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'log-in-page',
  templateUrl: './log-in-page.component.html',
  styleUrls: ['./log-in-page.component.css']
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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private corporateAuthService: CorporateAuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
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
  }

  onSubmit() {
    console.log('onSubmit called', {
      formValues: this.loginForm.value,
      isValid: this.loginForm.valid,
      isInvalid: this.loginForm.invalid
    });

    if (this.loginForm.invalid) {
      this.errorMessage = 'Please enter both email and password';
      console.log('Setting errorMessage:', this.errorMessage);
      this.cdr.detectChanges();
      return;
    }

    const { email, password } = this.loginForm.value;
    const loginObservable = this.userType === 'corporate'
      ? this.corporateAuthService.loginCorporate(email, password)
      : this.authService.login(email, password);

    // Inside log-in-page.component.ts onSubmit()
    loginObservable.subscribe({
      next: (response: any) => {
        if (response.message === 'Login successful' && response.access) {
          this.errorMessage = '';
          localStorage.setItem('jwtToken', response.access);
          this.loginSubmit.emit(response);
        } else {
          this.errorMessage = response.error || 'Invalid Email or Password';
          this.cdr.detectChanges();
          // DO NOT emit loginSubmit on error
        }
      },
      error: (err) => {
        this.errorMessage = 'Invalid Email or Password';
        this.cdr.detectChanges();
        // DO NOT emit loginSubmit in error block
      }
    });

  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.cdr.detectChanges();
  }
}