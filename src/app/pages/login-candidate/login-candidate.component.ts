import { Component } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AuthService } from '../../services/candidate.service';
import { UserProfileService } from '../../services/user-profile.service';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'login-candidate',
  templateUrl: 'login-candidate.component.html',
  styleUrls: ['login-candidate.component.css'],
})
export class LoginCandidate {
  errorMessage: string = '';

  constructor(
    private title: Title,
    private meta: Meta,
    private authService: AuthService,
    private userProfileService: UserProfileService,
    private router: Router,
    private spinner: NgxSpinnerService,
  ) {
    this.title.setTitle('Login-Candidate - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Login-Candidate - Flashyre',
      },
      {
        property: 'og:image',
        content: 'your-og-image-url',
      },
    ]);
  }

  onLoginSubmit(event: { email: string, password: string }) {
    this.spinner.show();

    this.authService.login(event.email, event.password).subscribe(
      (response) => {
        if (response.message === 'Login successful') {
          // Fetch user profile after successful login
          this.userProfileService.fetchUserProfile().subscribe(
            () => {
              this.errorMessage = '';
              this.router.navigate(['/candidate-home']);
            },
            (profileError) => {
              console.error('Error fetching profile', profileError);
              // Navigate anyway, but with a warning
              this.router.navigate(['/candidate-home']);
            }
          );
        } else {
          this.errorMessage = 'Unexpected response from server';
        }
        this.spinner.hide();
      },
      (error) => {
        this.errorMessage = error.error?.error || 'Login failed';
        this.spinner.hide();
      }
    );
  }
}