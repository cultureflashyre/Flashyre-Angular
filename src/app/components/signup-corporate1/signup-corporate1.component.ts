import { Component, OnInit, Input, ContentChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService
import { environment } from '../../../environments/environment';

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
        company_name: ['', Validators.required], // keep simple for now or add validators if needed
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
      const formData = { ...this.signupForm.value };
      delete formData.confirm_password;
      this.corporateAuthService.signupCorporate(formData).subscribe({
        next: (response) => {
          this.showSuccessPopup = true;
          this.errorMessage = '';
        },
        error: (error) => {
          this.errorMessage = error.error?.error || 'An error occurred during signup.';
        }
      });
    } else {
      this.errorMessage = 'Please fill in all required fields correctly.';
      // Mark all fields as touched to show error messages
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