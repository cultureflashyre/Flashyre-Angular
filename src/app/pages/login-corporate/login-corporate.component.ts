import { Component } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { UserProfileService } from '../../services/user-profile.service';

@Component({
  selector: 'login-corporate',
  templateUrl: './login-corporate.component.html',
  styleUrls: ['./login-corporate.component.css']
})
export class LoginCorporate {
  errorMessage: string = '';

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    private userProfileService: UserProfileService,
    private spinner: NgxSpinnerService,
  ) {
    this.title.setTitle('Login-Corporate - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Login-Corporate - Flashyre'
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original'
      }
    ]);
  }

  onLoginSubmit(response: any) {
    this.spinner.show();

    if (response.message === 'Login successful' && response.access) {
      console.log("Login response: ", response);
      localStorage.setItem('jwtToken', response.access); // Ensure token is stored
      // Store user_id in local storage
      localStorage.setItem('user_id', response.user_id);
      localStorage.setItem('userType', response.role);
      
      this.userProfileService.fetchUserProfile().subscribe({
        next: () => {
          this.errorMessage = '';
          this.router.navigate(['/recruiter-view-3rd-page']);
        },
        error: (profileError) => {
          console.error('Error fetching profile', profileError);
          // Navigate anyway, but with a warning
          this.router.navigate(['/recruiter-view-3rd-page']);
        }
      });
    } else {
      this.errorMessage = response.error || 'Login failed';
      console.error('Login failed:', response);
    }
    this.spinner.hide();
  }
}