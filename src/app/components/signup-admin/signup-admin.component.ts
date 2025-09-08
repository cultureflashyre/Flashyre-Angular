import { Component, OnInit, Input, ContentChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService
import { environment } from '../../../environments/environment';
import { UserProfileService } from '../../services/user-profile.service';

@Component({
  selector: 'signup-candidate1',
  templateUrl: './signup-admin.component.html',
  styleUrls: ['./signup-admin.component.css'],
})
export class Signupadmin implements OnInit {

  private baseUrl = environment.apiUrl;

  // Content projection properties
  @Input() rootClassName: string = '';
  @ContentChild('heading') heading: TemplateRef<any>;
  @ContentChild('text') text: TemplateRef<any>;
  @ContentChild('text1') text1: TemplateRef<any>;
  @ContentChild('text12') text12: TemplateRef<any>;
  @ContentChild('text11') text11: TemplateRef<any>;
  @ContentChild('text111') text111: TemplateRef<any>;
  @ContentChild('text2') text2: TemplateRef<any>;
  @ContentChild('text1111') text1111: TemplateRef<any>;
  @ContentChild('text21') text21: TemplateRef<any>;
  @ContentChild('button') button: TemplateRef<any>;
  @ContentChild('text71') text71: TemplateRef<any>;
  @ContentChild('text6') text6: TemplateRef<any>;
  @ContentChild('text5') text5: TemplateRef<any>;

  // Reactive form properties
  signupForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  passwordType: string = 'password';
  confirmPasswordType: string = 'password';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private spinner: NgxSpinnerService,
    private userProfileService: UserProfileService,
  ) {}

  ngOnInit() {
    this.signupForm = this.fb.group(
      {
        first_name: ['', [Validators.required, 
          Validators.pattern(/^[a-zA-Z ]+$/), 
          Validators.minLength(3),
          Validators.maxLength(10),
        ]],
        last_name: ['', [Validators.required, 
          Validators.pattern(/^[a-zA-Z ]+$/), 
          Validators.minLength(3),
          Validators.maxLength(10),
      ]],
        phone_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)], [this.phoneExistsValidator()]],
        email: ['', [Validators.required, Validators.email], [this.emailExistsValidator()]],
        password: ['', [Validators.required, 
          this.passwordComplexityValidator(), 
          Validators.minLength(8),
          Validators.maxLength(15)
        ]],
        confirm_password: ['', [Validators.required]],
        user_type: ['admin', Validators.required]  // default candidate or empty
      },
      { validator: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password').value === form.get('confirm_password').value
      ? null
      : { mismatch: true };
  }

  passwordComplexityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value || '';

    if (!value) {
      return null; // Let required validator handle empty case
    }

    const errors: ValidationErrors = {};

    if (value.length < 8) {
      errors.minlength = { requiredLength: 8, actualLength: value.length };
    }
    if (!/[A-Z]/.test(value)) {
      errors.uppercase = true;
    }
    if (!/[a-z]/.test(value)) {
      errors.lowercase = true;
    }
    if (!/[0-9]/.test(value)) {
      errors.number = true;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      errors.specialChar = true;
    }
    // At least one alphabet is covered by uppercase or lowercase, but if you want to explicitly check:
    if (!/[a-zA-Z]/.test(value)) {
      errors.alphabet = true;
    }

    return Object.keys(errors).length ? errors : null;
  };
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
    this.signupForm.get('phone_number').setValue(sanitizedValue, { emitEvent: false });
  }

  onSubmit() {
    if (this.signupForm.valid) {
      this.spinner.show(); // Show spinner only when request starts

      const formData = {
        first_name: this.signupForm.get('first_name').value,
        last_name: this.signupForm.get('last_name').value,
        phone_number: this.signupForm.get('phone_number').value,
        email: this.signupForm.get('email').value,
        password: this.signupForm.get('password').value,
        user_type: 'admin',
      };

      this.http.post(`${this.baseUrl}api/auth/signup/`, formData).subscribe(
        (response: any) => {
          console.log('Signup successful', response);
          this.errorMessage = '';
          this.successMessage = response.message || 'Successfully Signed up';
          
          // Store JWT token in local storage or session storage
          localStorage.setItem('jwtToken', response.access); // Store the access token
          localStorage.setItem('refreshToken', response.refresh);
          localStorage.setItem('userID', response.user_id); // Store the user_id
          localStorage.setItem('userType', response.role);

          // Fetch user profile after successful login
          this.userProfileService.fetchUserProfile().subscribe(
            () => {
              this.errorMessage = '';
              this.router.navigate(['/admin-page1'], { state: { source: 'admin' } });
            },
            (profileError) => {
              console.error('Error fetching profile', profileError);
              // Navigate anyway, but with a warning
              this.router.navigate(['/admin-page1'], { state: { source: 'admin' } });
            }
          );
          // Hide overlay before navigation
          this.spinner.hide();
        },
        (error) => {
          console.log('Error response:', error);
          this.successMessage = '';

          // Hide overlay on error
          this.spinner.hide();

          if (error.status === 400 && error.error.email) {
            this.errorMessage = 'Email already exists!';
          } else if (error.status === 400 && error.error.phone_number) {
            this.errorMessage = 'Phone number already exists!';
          } else {
            this.errorMessage = 'Signup failed. Please try again.';
          }
          console.log('Error message set to:', this.errorMessage);
        }
      );
    }
  }

  phoneExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const phone = control.value;
      if (!phone) return of(null);
      return this.http.get(`${this.baseUrl}check-phone/?phone=${phone}`).pipe(
        map((res: any) => (res.exists ? { phoneExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  emailExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;
      if (!email) return of(null);
      return this.http.get(`${this.baseUrl}check-email/?email=${email}`).pipe(
        map((res: any) => (res.exists ? { emailExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }
}