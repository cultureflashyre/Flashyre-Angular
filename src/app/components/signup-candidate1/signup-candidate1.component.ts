import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'signup-candidate1',
  templateUrl: './signup-candidate1.component.html',
  styleUrls: ['./signup-candidate1.component.css'],
})
export class SignupCandidate1 implements OnInit {
  signupForm: FormGroup;
  errorMessage: string = '';
  passwordType: string = 'password';
  confirmPasswordType: string = 'password';

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit() {
    this.signupForm = this.fb.group(
      {
        first_name: ['', Validators.required],
        last_name: ['', Validators.required],
        phone_number: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirm_password: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password').value === form.get('confirm_password').value
      ? null
      : { mismatch: true };
  }

  togglePasswordVisibility() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordType = this.confirmPasswordType === 'password' ? 'text' : 'password';
  }

  onSubmit() {
    if (this.signupForm.valid) {
      const formData = {
        first_name: this.signupForm.get('first_name').value,
        last_name: this.signupForm.get('last_name').value,
        phone_number: this.signupForm.get('phone_number').value,
        email: this.signupForm.get('email').value,
        password: this.signupForm.get('password').value,
      };

      this.http.post('http://localhost:8000/api/signup-candidate/', formData).subscribe(
        (response) => {
          console.log('Signup successful', response);
          // TODO: Redirect to login page or dashboard
        },
        (error) => {
          if (error.status === 400 && error.error.email) {
            this.errorMessage = 'Email already exists!';
          } else {
            this.errorMessage = 'Signup failed. Please try again.';
          }
        }
      );
    }
  }
}