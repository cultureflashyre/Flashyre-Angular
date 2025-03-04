import { Component, OnInit, Input, ContentChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; // Import Router
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'signup-corporate1',
  templateUrl: 'signup-corporate1.component.html',
  styleUrls: ['signup-corporate1.component.css'],
})
export class SignupCorporate1 implements OnInit {
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
  @ContentChild('heading') heading: TemplateRef<any>;
  @ContentChild('text111') text111: TemplateRef<any>;
  @ContentChild('text2') text2: TemplateRef<any>;
  @ContentChild('text6') text6: TemplateRef<any>;
  @ContentChild('text71') text71: TemplateRef<any>;

  signupForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  passwordType: string = 'password';
  confirmPasswordType: string = 'password';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router // Inject Router
  ) {}

  ngOnInit() {
    this.signupForm = this.fb.group(
      {
        first_name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z ]+$/)]],
        last_name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z ]+$/)]],
        company_name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z ]+$/)]],
        phone_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)], [this.phoneExistsValidator()]],
        email: ['', [Validators.required, Validators.email], [this.emailExistsValidator()]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirm_password: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')!.value === form.get('confirm_password')!.value
      ? null
      : { mismatch: true };
  }

  togglePasswordVisibility() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordType = this.confirmPasswordType === 'password' ? 'text' : 'password';
  }

  sanitizePhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/\D/g, '').slice(0, 10);
    this.signupForm.get('phone_number')!.setValue(sanitizedValue, { emitEvent: false });
  }

  onSubmit() {
    if (this.signupForm.valid) {
      const formData = {
        first_name: this.signupForm.get('first_name')!.value,
        last_name: this.signupForm.get('last_name')!.value,
        company_name: this.signupForm.get('company_name')!.value,
        phone_number: this.signupForm.get('phone_number')!.value,
        email: this.signupForm.get('email')!.value,
        password: this.signupForm.get('password')!.value,
      };

      this.http.post('http://localhost:8000/signup-corporate/', formData).subscribe(
        (response) => {
          console.log('Signup successful', response);
          this.successMessage = 'Signup successful! Redirecting...';
          this.errorMessage = '';
          // Redirect to recruiter-view-3rd-page after a short delay
          setTimeout(() => {
            this.router.navigate(['/recruiter-view-3rd-page']);
          }, 2000); // 2-second delay to show the success message
        },
        (error) => {
          console.log('Error response:', error);
          if (error.status === 400 && error.error.error) {
            this.errorMessage = error.error.error;
          } else if (error.status === 500 || error.status === 503) {
            this.errorMessage = error.error.error || 'Server error. Please try again later.';
          } else {
            this.errorMessage = 'Signup failed. Please try again.';
          }
          this.successMessage = '';
        }
      );
    }
  }

  phoneExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const phone = control.value;
      if (!phone) return of(null);
      return this.http.get(`http://localhost:8000/check/phone/?phone=${phone}`).pipe(
        map((res: any) => (res.exists ? { phoneExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  emailExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;
      if (!email) return of(null);
      return this.http.get(`http://localhost:8000/check/email/?email=${email}`).pipe(
        map((res: any) => (res.exists ? { emailExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }
}