import { Component, OnInit, Input, ContentChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService
import { environment } from '../../../environments/environment';
import { UserProfileService } from '../../services/user-profile.service';

@Component({
  selector: 'signup-corporate1',
  templateUrl: './signup-corporate1.component.html',
  styleUrls: ['./signup-corporate1.component.css']
})
export class SignupCorporate1 implements OnInit {

  private baseUrl = environment.apiUrl;

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
  showSuccessPopup: boolean = false;
  passwordType: string = 'password';
  confirmPasswordType: string = 'password';
  passwordButtonText: string = 'Show';
  confirmPasswordButtonText: string = 'Show';

  constructor(
    private fb: FormBuilder,
    private corporateAuthService: CorporateAuthService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private http: HttpClient,
    private userProfileService: UserProfileService
  ) {  }

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
        // company_name: ['', Validators.required], // keep simple for now or add validators if needed
        phone_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)], [this.phoneExistsValidator()]],
        email: ['', [Validators.required, Validators.email], [this.emailExistsValidator()]],
        password: ['', [Validators.required, 
          this.passwordComplexityValidator(), 
          Validators.minLength(8),
          Validators.maxLength(15)
        ]],
        confirm_password: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  phoneExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const phone = control.value;
      if (!phone) return of(null);
      return this.http.get(`${this.baseUrl}check-phone/?phone=${phone}`, { withCredentials: true }).pipe(
        map((res: any) => (res.exists ? { phoneExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }
    
  emailExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;
      if (!email) return of(null);
      return this.http.get(`${this.baseUrl}check-email/?email=${email}`, { withCredentials: true }).pipe(
        map((res: any) => (res.exists ? { emailExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  sanitizePhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/\D/g, '').slice(0, 10);
    this.signupForm.get('phone_number').setValue(sanitizedValue, { emitEvent: false });
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

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')!.value === form.get('confirm_password')!.value
      ? null
      : { mismatch: true };
  }

  onSubmit() {
    if (this.signupForm.valid) {
      this.spinner.show(); // show spinner as in candidate signup

      const formData = { ...this.signupForm.value };
      
      // Remove confirm_password as backend does not need it
      delete formData.confirm_password;
      
      // Add explicit user_type for corporate (recruiter)
      formData.user_type = 'recruiter';

      // Make POST request to same candidate signup API path (e.g., 'signup-candidate/' or unified backend path)
      this.http.post(`${this.baseUrl}api/auth/signup/`, formData).subscribe({
        next: (response: any) => {
          this.showSuccessPopup = true;
          this.errorMessage = '';
          
          // Store JWT tokens in localStorage just like candidate signup
          localStorage.setItem('jwtToken', response.access);
          localStorage.setItem('refreshToken', response.refresh);
          localStorage.setItem('userID', response.user_id); // Store the user_id
          localStorage.setItem('userType', response.role);
          
          // Fetch user profile
          this.userProfileService.fetchUserProfile().subscribe(
            () => {
              this.router.navigate(['/profile-overview-page']);
            },
            (profileError) => {
              console.error('Error fetching profile', profileError);
              this.router.navigate(['/profile-overview-page']);
            }
          );

          this.spinner.hide(); // hide spinner after all done
        },
        error: (error) => {
          this.spinner.hide(); // hide spinner on error
          if (error.status === 400 && error.error.email) {
            this.errorMessage = 'Email already exists!';
          } else if (error.status === 400 && error.error.phone_number) {
            this.errorMessage = 'Phone number already exists!';
          } else {
            this.errorMessage = error.error?.error || 'Signup failed. Please try again.';
          }
        }
      });
    } else {
      this.errorMessage = 'Please fill in all required fields correctly.';
      this.signupForm.markAllAsTouched();
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

  closePopup() {
    this.showSuccessPopup = false;
    this.router.navigate(['/login-corporate']);
  }
}