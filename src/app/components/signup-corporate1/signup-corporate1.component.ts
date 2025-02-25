import { Component, Input, ContentChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'signup-corporate1',
  templateUrl: 'signup-corporate1.component.html',
  styleUrls: ['signup-corporate1.component.css'],
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
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      company_name: ['', Validators.required],
      phone_number: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required],
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')!.value === form.get('confirm_password')!.value
      ? null
      : { mismatch: true };
  }

  onSubmit() {
    if (this.signupForm.valid) {
      const formData = { ...this.signupForm.value };
      delete formData.confirm_password; // Exclude confirm_password from backend data
      this.http.post('http://localhost:8000/api/signup-corporate/', formData).subscribe({
        next: (response) => {
          console.log('Signup successful', response);
          this.successMessage = 'Signup successful! Redirecting to login...';
          setTimeout(() => {
            this.router.navigate(['/login-corporate']);
          }, 2000);
        },
        error: (error) => {
          console.error('Signup error', error);
          this.errorMessage = error.error?.message || 'An error occurred during signup.';
        },
      });
    } else {
      this.errorMessage = 'Please fill in all required fields correctly.';
    }
  }

  togglePasswordVisibility() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordType = this.confirmPasswordType === 'password' ? 'text' : 'password';
  }

  navigateToLogin() {
    this.router.navigate(['/login-corporate']);
  }
}