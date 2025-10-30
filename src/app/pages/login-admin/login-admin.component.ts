import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AuthService } from '../../services/candidate.service';
import { UserProfileService } from '../../services/user-profile.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'login-admin',
  templateUrl: 'login-admin.component.html',
  styleUrls: ['login-admin.component.css'],
})
export class LoginAdmin implements OnInit {
  errorMessage: string = '';
  returnUrl: string;

  constructor(
    private title: Title,
    private meta: Meta,
    private authService: AuthService,
    private userProfileService: UserProfileService,
    private router: Router,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
  ) {
    this.title.setTitle('Login-admin - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Login-admin - Flashyre',
      },
      {
        property: 'og:image',
        content: 'your-og-image-url',
      },
    ]);
  }

  ngOnInit() {
    // Capture returnUrl query param or default to candidate login page
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/login-admin';
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
          this.router.navigate(['/recruiter-view-3rd-page1']);
        },
        error: (profileError) => {
          console.error('Error fetching profile', profileError);
          // Navigate anyway, but with a warning
          this.router.navigate(['/recruiter-view-3rd-page1']);
        }
      });
    } else {
      this.errorMessage = response.error || 'Login failed';
      console.error('Login failed:', response);
    }
    this.spinner.hide();
  }
}