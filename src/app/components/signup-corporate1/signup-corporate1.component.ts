import { Component, Input, ContentChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { Observable, of } from 'rxjs';
import { debounceTime, switchMap, map, catchError } from 'rxjs/operators';

@Component({
  selector: 'signup-corporate1',
  templateUrl: './signup-corporate1.component.html',
  styleUrls: ['./signup-corporate1.component.css']
})
export class SignupCorporate1 {
  @ContentChild('button') button: TemplateRef<any>;
  @ContentChild('text12') text12: TemplateRef<any>;
  @ContentChild('text13') text13: TemplateRef<any>;
  @ContentChild('text1111') text1111: TemplateRef<any>;
  @Input() rootClassName: string = '';
  @ContentChild('text') text: TemplateRef<any>;
  @ContentChild('text1') text1: TemplateRef<any>;
  @ContentChild('text11') text11: TemplateRef<any>;
  @ContentChild('text5') text5: TemplateRef<any>;
  @ContentChild('text21') text21: TemplateRef<any>;
  @ContentChild('text111') text111: TemplateRef<any>;
  @ContentChild('text2') text2: TemplateRef<any>;
  @ContentChild('text6') text6: TemplateRef<any>;
  @ContentChild('text71') text71: TemplateRef<any>;
  @ContentChild('heading') heading: TemplateRef<any>;

  signupForm: FormGroup;
  errorMessage: string = '';
  showSuccessPopup: boolean = false;
  passwordType: string = 'password';
  confirmPasswordType: string = 'password';
  passwordButtonText: string = 'Show';
  confirmPasswordButtonText: string = 'Show';

  constructor(
    private fb: FormBuilder,
    private corporateAuthService: CorporateAuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      company_name: ['', Validators.required],
      phone_number: ['', 
        [Validators.required, Validators.pattern(/^\d{10}$/), Validators.maxLength(10)],
        [this.phoneExistsValidator()] // Add async validator
      ],
      email: ['', 
        [Validators.required, Validators.email],
        [this.emailExistsValidator()] // Add async validator
      ],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(15)
      ]],
      confirm_password: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')!.value;
    const confirmPassword = form.get('confirm_password')!.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  restrictToNumbers(event: KeyboardEvent): boolean {
    const input = (event.target as HTMLInputElement).value;
    const charCode = event.charCode ? event.charCode : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    if (input.length >= 10) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  // Async validator for phone number
  phoneExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const phone = control.value;
      // Only validate if the phone number is exactly 10 digits
      if (!phone || !/^\d{10}$/.test(phone)) {
        return of(null);
      }
      return of(phone).pipe(
        debounceTime(300), // Reduced to 300ms for faster feedback
        switchMap(value =>
          this.corporateAuthService.checkPhone(value).pipe(
            map((res: any) => (res.exists ? { phoneExists: true } : null)),
            catchError(() => of(null))
          )
        )
      );
    };
  }

  // Async validator for email
  emailExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;
      // Only validate if the email is in a valid format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return of(null);
      }
      return of(email).pipe(
        debounceTime(300), // Reduced to 300ms for faster feedback
        switchMap(value =>
          this.corporateAuthService.checkEmail(value).pipe(
            map((res: any) => (res.exists ? { emailExists: true } : null)),
            catchError(() => of(null))
          )
        )
      );
    };
  }

  onSubmit() {
    if (this.signupForm.valid) {
      const formData = { ...this.signupForm.value };
      delete formData.confirm_password;
      console.log('Sending signup data:', formData);
      this.corporateAuthService.signupCorporate(formData).subscribe({
        next: (response) => {
          console.log('Signup response:', response);
          this.showSuccessPopup = true;
          this.errorMessage = '';
          // Redirect to login-corporate after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/login-corporate']);
          }, 2000);
        },
        error: (error) => {
          console.log('Signup error:', error);
          this.errorMessage = '';
          const errors = error.error?.errors || {};
          if (errors.phone_number) {
            this.signupForm.get('phone_number')?.setErrors({ serverError: errors.phone_number[0] });
          }
          if (errors.email) {
            this.signupForm.get('email')?.setErrors({ serverError: errors.email[0] });
          }
          if (!error.error?.errors) {
            this.errorMessage = error.message || 'An error occurred during signup.';
          }
        }
      });
    } else {
      this.signupForm.markAllAsTouched();
      if (this.signupForm.errors?.mismatch) {
        this.errorMessage = 'Passwords do not match';
      } else if (this.signupForm.get('password')?.errors?.minlength) {
        this.errorMessage = 'Password must be at least 8 characters long';
      } else if (this.signupForm.get('password')?.errors?.maxlength) {
        this.errorMessage = 'Password cannot exceed 15 characters';
      } else if (this.signupForm.get('phone_number')?.errors?.pattern) {
        this.errorMessage = 'Phone number must be exactly 10 digits';
      } else {
        this.errorMessage = 'Please fill in all required fields correctly';
      }
    }
  }

  togglePasswordVisibility() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
    this.passwordButtonText = this.passwordType === 'password' ? 'Show' : 'Hide';
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordType = this.confirmPasswordType === 'password' ? 'text' : 'password';
    this.confirmPasswordButtonText = this.confirmPasswordType === 'password' ? 'Show' : 'Hide';
  }

  navigateToLogin() {
    this.router.navigate(['/login-corporate']);
  }
}
