import { Component, OnInit, Input, ContentChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../../environments/environment';
import { UserProfileService } from '../../services/user-profile.service';
import { AdminAuthService } from '../../services/admin-auth.service'; // Using the dedicated service
import { ThumbnailService } from '../../services/thumbnail.service'; // Import your thumbnail service

@Component({
  selector: 'signup-admin1',
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
    private adminAuthService: AdminAuthService, // Inject the dedicated service
    private thumbnailService: ThumbnailService // Inject ThumbnailService
  ) {}

  ngOnInit() {
    this.signupForm = this.fb.group(
      {
        first_name: ['', [
          Validators.required, 
          Validators.pattern(/^[a-zA-Z ]+$/), 
          Validators.minLength(3),
          Validators.maxLength(10),
        ]],
        last_name: ['', [
          Validators.required, 
          Validators.pattern(/^[a-zA-Z ]+$/), 
          Validators.minLength(3),
          Validators.maxLength(10),
        ]],
        phone_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)], [this.phoneExistsValidator()]],
        email: ['', [Validators.required, Validators.email], [this.emailExistsValidator()]],
        password: ['', [
          Validators.required, 
          this.passwordComplexityValidator(), 
          Validators.minLength(8),
          Validators.maxLength(15)
        ]],
        confirm_password: ['', [Validators.required]],
        // ----- THIS IS THE CORRECTED LINE THAT FIXES THE ISSUE -----
        user_type:  ['admin', Validators.required]
      },
      { validator: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: FormGroup): ValidationErrors | null {
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
      if (!/[a-zA-Z]/.test(value)) {
        errors.alphabet = true;
      }
      return Object.keys(errors).length ? errors : null;
    };
  }

  togglePasswordVisibility(): void {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordType = this.confirmPasswordType === 'password' ? 'text' : 'password';
  }

  sanitizePhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/\D/g, '').slice(0, 10);
    this.signupForm.get('phone_number').setValue(sanitizedValue, { emitEvent: false });
  }

  onSubmit(): void {
    // --- Detailed logging block for debugging ---
    console.log('--- [Frontend Log] Admin Signup Initiated ---');
    console.log('Form validity:', this.signupForm.valid);
    console.log('Form data to be sent:', JSON.stringify(this.signupForm.value, null, 2));

    if (this.signupForm.valid) {
      this.spinner.show();

      // Get the full name by combining first and last name
      const fullName = `${this.signupForm.value.first_name} ${this.signupForm.value.last_name}`;

      // Use ThumbnailService to get initials
      const initials = this.thumbnailService.getUserInitials(fullName);

      // Create the payload with initials added
      const signupData = {
        ...this.signupForm.value,
        initials: initials  // add initials here
      };

      this.adminAuthService.signupAdmin(signupData).subscribe({
        next: (response: any) => {
          console.log('--- [Frontend Log] Admin Signup SUCCESS ---', response);
          this.errorMessage = '';
          this.successMessage = response.message || 'Successfully Signed up';
          
          localStorage.setItem('jwtToken', response.access);
          localStorage.setItem('refreshToken', response.refresh);
          localStorage.setItem('userID', response.user_id);
          localStorage.setItem('userType', response.role);

          this.userProfileService.fetchUserProfile().subscribe({
            next: () => {
              this.router.navigate(['/admin-page1'], { state: { source: 'admin' } });
              this.spinner.hide();
            },
            error: (profileError) => {
              console.error('Error fetching profile', profileError);
              this.router.navigate(['/admin-page1'], { state: { source: 'admin' } });
              this.spinner.hide();
            }
          });
        },
        error: (error) => {
          console.error('--- [Frontend Log] Admin Signup FAILED ---', error);
          this.successMessage = '';
          this.spinner.hide();

          if (error.status === 400 && error.error.email) {
            this.errorMessage = 'Email already exists!';
          } else if (error.status === 400 && error.error.phone_number) {
            this.errorMessage = 'Phone number already exists!';
          } else {
            this.errorMessage = 'Signup failed. Please try again.';
          }
        }
      });
    } else {
      console.error('--- [Frontend Log] Form is invalid. Submission blocked. ---');
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