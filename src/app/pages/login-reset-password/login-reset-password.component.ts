import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResetService } from '../../services/reset.service';
import { Router, ActivatedRoute } from '@angular/router';

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-login-reset-password',
  standalone: true,
    imports: [ RouterModule, FormsModule, CommonModule,
      ],
  templateUrl: './login-reset-password.component.html',
  styleUrls: ['./login-reset-password.component.css'],
})
export class LoginResetPasswordComponent implements OnInit, OnDestroy {
  email: string | null = null;
  otp: string = '';
  password: string = '';
  confirmPassword: string = '';
  message: string = '';
  error: string = '';
  loading: boolean = false;
  isOTPVerified: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  countdown: number = 60;
  private countdownInterval: any;

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
          window.location.href = '/login-forgot-password';
        }, 3000);
      } else {
        localStorage.setItem('resetEmail', this.email);
        console.log('Email retrieved successfully, rendering form');
        this.startCountdown();
      }
    });
  }

  ngOnDestroy(): void {
    // Clear countdown interval to prevent memory leaks
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown(): void {
    this.countdown = 60;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.countdownInterval = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  resendOTP(): void {
    if (!this.email) {
      this.error = 'Email is required to resend OTP.';
      console.log('resendOTP failed: missing email');
      return;
    }

    this.loading = true;
    this.message = '';
    this.error = '';
    this.otp = ''; // Clear previous OTP

    this.resetService.forgotPassword(this.email).subscribe({
      next: (response) => {
        console.log('Resend OTP response:', response);
        this.message = response.message || 'New OTP sent successfully.';
        this.loading = false;
        this.startCountdown();
      },
      error: (err) => {
        console.error('Resend OTP error:', err);
        this.error = err.message || 'Failed to resend OTP. Please try again.';
        this.loading = false;
      },
    });
  }

  verifyOTP() {
    console.log('verifyOTP called with email:', this.email, 'OTP:', this.otp);

     if (this.countdown === 0) {
      this.error = 'OTP has expired. Please request a new one by clicking "Resend".';
      console.log('verifyOTP failed: OTP expired on the frontend.');
      return; // Stop the function from proceeding
    }

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
        clearInterval(this.countdownInterval); // Stop countdown on successful verification
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

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,15}$/;
    if (!passwordRegex.test(this.password)) {
      // See the next section for the recommended error message
      this.error = `Password does not meet requirements. It must be 8-15 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.`;
      this.loading = false;
      console.log('resetPassword failed: password complexity validation failed');
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
          window.location.href = '/login-candidate';
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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onKeydown(event: KeyboardEvent, field: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (field === 'password') {
        this.togglePasswordVisibility();
      } else if (field === 'confirmPassword') {
        this.toggleConfirmPasswordVisibility();
      }
    }
  }
}