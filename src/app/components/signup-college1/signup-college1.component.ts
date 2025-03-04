import { Component, OnInit, Input, ContentChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LoggerService } from '../../services/logger.service';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'signup-college1',
  templateUrl: 'signup-college1.component.html',
  styleUrls: ['signup-college1.component.css'],
})
export class SignupCollege1 implements OnInit {
  @Input() rootClassName: string = '';
  @ContentChild('text6') text6: TemplateRef<any>;
  @ContentChild('text121') text121: TemplateRef<any>;
  @ContentChild('text11') text11: TemplateRef<any>;
  @ContentChild('text12') text12: TemplateRef<any>;
  @ContentChild('text1111') text1111: TemplateRef<any>;
  @ContentChild('text112') text112: TemplateRef<any>;
  @ContentChild('button') button: TemplateRef<any>;
  @ContentChild('heading') heading: TemplateRef<any>;
  @ContentChild('text111') text111: TemplateRef<any>;
  @ContentChild('text21') text21: TemplateRef<any>;
  @ContentChild('text71') text71: TemplateRef<any>;
  @ContentChild('text5') text5: TemplateRef<any>;
  @ContentChild('text') text: TemplateRef<any>;
  @ContentChild('text2') text2: TemplateRef<any>;
  @ContentChild('text22') text22: TemplateRef<any>;
  @ContentChild('text1') text1: TemplateRef<any>;

  signupForm: FormGroup;
  universities: string[] = ['University A', 'University B', 'University C'];
  errorMessage: string = '';
  passwordType: string = 'password';
  confirmPasswordType: string = 'password';

  constructor(private fb: FormBuilder, private http: HttpClient, private logger: LoggerService, private router: Router) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group(
      {
        first_name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z ]+$/)]],
        last_name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z ]+$/)]],
        phone_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)], [this.phoneExistsValidator()]],
        university_college: ['', Validators.required],
        university_college_id: ['', Validators.required],
        email: ['', [Validators.required, Validators.email], [this.emailExistsValidator()]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirm_password: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );

    this.logger.debug('SignupCollege1 component initialized');
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    return control.get('password')?.value === control.get('confirm_password')?.value
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
    this.signupForm.get('phone_number')?.setValue(sanitizedValue, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.logger.debug('Submitting signup form with data:', this.signupForm.value);

      const formData = {
        first_name: this.signupForm.get('first_name')?.value,
        last_name: this.signupForm.get('last_name')?.value,
        phone_number: this.signupForm.get('phone_number')?.value,
        university_college: this.signupForm.get('university_college')?.value,
        university_college_id: this.signupForm.get('university_college_id')?.value,
        email: this.signupForm.get('email')?.value,
        password: this.signupForm.get('password')?.value,
        confirm_password: this.signupForm.get('confirm_password')?.value, // Added
      };

      this.logger.debug('Payload being sent:', formData); // Log payload for debugging

      this.http.post('http://localhost:8000/api/signup/', formData).subscribe(
        (response) => {
          this.logger.info('Signup successful', response);
          this.errorMessage = '';
          this.router.navigate(['/flashre-dashboard']);

        },
        (error) => {
          this.logger.error('Signup failed with status:', error.status, error.error);
          this.errorMessage = this.getErrorMessage(error);
        }
      );
    } else {
      this.handleInvalidForm();
    }
  }

  handleInvalidForm() {
    const invalidControls = [];
    for (const controlName in this.signupForm.controls) {
      const control = this.signupForm.get(controlName);
      if (control?.invalid) {
        invalidControls.push({ name: controlName, errors: control.errors });
      }
    }
    this.logger.error('Form invalid. Invalid controls:', invalidControls);
    this.errorMessage = 'Please fill in all required fields correctly.';
  }

  getErrorMessage(error: any): string {
    if (error.status === 400 && error.error) {
      if (error.error.first_name) return error.error.first_name[0] || 'Invalid first name.';
      if (error.error.last_name) return error.error.last_name[0] || 'Invalid last name.';
      if (error.error.phone_number) return error.error.phone_number[0] || 'Phone number already exists!';
      if (error.error.university_college) return error.error.university_college[0] || 'University/College is required.';
      if (error.error.university_college_id) return error.error.university_college_id[0] || 'Invalid University/College ID.';
      if (error.error.email) return error.error.email[0] || 'Email already exists!';
      if (error.error.password) return error.error.password[0] || 'Invalid password.';
      if (error.error.confirm_password) return error.error.confirm_password[0] || 'Passwords do not match.';
      if (error.error.non_field_errors) return error.error.non_field_errors[0] || 'Invalid data.';
    }
    return 'Signup failed. Please try again.';
  }

  phoneExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const phone = control.value;
      if (!phone) return of(null);
      return this.http.get(`http://localhost:8000/api/check-phone/?phone=${phone}`).pipe(
        map((res: any) => (res.exists ? { phoneExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  emailExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;
      if (!email) return of(null);
      return this.http.get(`http://localhost:8000/api/check-email/?email=${email}`).pipe(
        map((res: any) => (res.exists ? { emailExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }
}