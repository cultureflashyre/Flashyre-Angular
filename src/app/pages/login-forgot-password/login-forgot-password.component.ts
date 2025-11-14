import { Component } from '@angular/core';
import { ResetService } from '../../services/reset.service';
import { Router } from '@angular/router';

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-login-forgot-password',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    ],
  templateUrl: './login-forgot-password.component.html',
  styleUrls: ['./login-forgot-password.component.css'],
})
export class ForgotPasswordComponent {
  email: string = '';
  message: string = '';
  error: string = '';
  loading: boolean = false;

  constructor(private resetService: ResetService, private router: Router) {
    console.log('ForgotPasswordComponent initialized');
  }

onSubmit() {
  console.log('onSubmit called with email:', this.email);
  this.loading = true;
  this.message = '';
  this.error = '';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!this.email || !emailRegex.test(this.email)) {
    this.error = 'Please enter a valid email address.';
    this.loading = false;
    console.log('Email validation failed:', this.email);
    return;
  }

  this.resetService.forgotPassword(this.email).subscribe({
    next: (response) => {
      console.log('Forgot password response:', response);
      this.message = response.message || 'OTP sent to your email';
      this.loading = false;
      this.router.navigate(['/login-reset-password'], {
        state: { email: this.email },
        queryParams: { email: this.email }
      });
    },
    error: (err) => {
      console.error('Forgot password error:', err);
      this.error = err.message || 'Something went wrong';
      this.loading = false;
    },
  });
}
}