import { Component, OnInit } from '@angular/core';
import { ResetService } from '../../services/reset.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login-reset-password',
  templateUrl: './login-reset-password.component.html',
  styleUrls: ['./login-reset-password.component.css'],
})
export class LoginResetPasswordComponent implements OnInit {
  email: string | null = null;
  otp: string = '';
  password: string = '';
  confirmPassword: string = '';
  message: string = '';
  error: string = '';
  loading: boolean = false;
  isOTPVerified: boolean = false;

  constructor(
    private resetService: ResetService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    console.log('LoginResetPasswordComponent initialized');
  }

  ngOnInit(): void {
    // Retrieve email from navigation state
    this.email = history.state.email || null;
    console.log('Retrieved email from state:', this.email);

    // Fallback: Check query parameters
    this.route.queryParams.subscribe(params => {
      if (!this.email && params['email']) {
        this.email = params['email'];
        console.log('Retrieved email from query params:', this.email);
      }

      // Fallback: Check local storage
      if (!this.email) {
        this.email = localStorage.getItem('resetEmail');
        console.log('Retrieved email from local storage:', this.email);
      }

      // Handle missing email
      if (!this.email) {
        console.log('No email found in state, query params, or local storage');
        this.error = 'Email is missing. Redirecting to Forgot Password page...';
        setTimeout(() => {
          window.location.href = '/login-forgot-password'; // Fallback navigation
        }, 3000);
      } else {
        localStorage.setItem('resetEmail', this.email);
        console.log('Email retrieved successfully, rendering form');
      }
    });
  }

  verifyOTP() {
    console.log('verifyOTP called with email:', this.email, 'OTP:', this.otp);
    if (!this.email || !this.otp) {
      this.error = 'Please enter a valid OTP.';
      console.log('verifyOTP failed: missing email or OTP');
      return;
    }

    this.loading = true;
    this.message = '';
    this.error = '';

    this.resetService.verifyOTP(this.email, this.otp).subscribe({
      next: (response) => {
        console.log('Verify OTP response:', response);
        this.message = response.message || 'OTP verified successfully.';
        this.isOTPVerified = true;
        this.loading = false;
      },
      error: (err) => {
        console.error('Verify OTP error:', err);
        this.error = err.message || 'Invalid or expired OTP.';
        this.loading = false;
      },
    });
  }

  resetPassword() {
    console.log('resetPassword called with:', { email: this.email, otp: this.otp, password: this.password });

    if (!this.isOTPVerified) {
      this.error = 'Please verify OTP first.';
      console.log('resetPassword failed: OTP not verified');
      return;
    }
    if (!this.password || !this.confirmPassword) {
      this.error = 'Please enter and confirm your new password.';
      console.log('resetPassword failed: missing password or confirmPassword');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      console.log('resetPassword failed: passwords do not match');
      return;
    }

    this.loading = true;
    this.message = '';
    this.error = '';

    this.resetService.resetPassword(this.email, this.otp, this.password).subscribe({
      next: (response) => {
        console.log('Reset password response:', response);
        this.message = response.message || 'Password reset successfully. You can now log in.';
        this.loading = false;
        localStorage.removeItem('resetEmail');
        setTimeout(() => {
          window.location.href = '/login-candidate'; // Adjusted to candidate login
        }, 2000);
      },
      error: (err) => {
        console.error('Reset password error:', err);
        this.error = err.message || 'Failed to reset password. Please try again.';
        this.loading = false;
      },
    });
  }

  handleSubmit() {
    console.log('handleSubmit called, isOTPVerified:', this.isOTPVerified);
    if (!this.email) {
      this.error = 'Email is required to proceed.';
      return;
    }
    if (!this.isOTPVerified) {
      this.verifyOTP();
    } else {
      this.resetPassword();
    }
  }

  getButtonText(): string {
    return this.isOTPVerified ? 'Reset Password' : 'Submit OTP';
  }

  getButtonAriaLabel(): string {
    return this.getButtonText();
  }
}