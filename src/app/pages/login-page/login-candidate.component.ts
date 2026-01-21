import { Component, OnInit, NgZone } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AuthService } from '../../services/candidate.service';
import { UserProfileService } from '../../services/user-profile.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { LogInPage } from 'src/app/components/log-in-page/log-in-page.component';
import { LoginPageNavbar } from 'src/app/components/login-page-navbar/login-page-navbar.component';

@Component({
  selector: 'login',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    LogInPage, LoginPageNavbar,
    ],
  templateUrl: 'login-candidate.component.html',
  styleUrls: ['login-candidate.component.css'],
})
export class LoginCandidate implements OnInit {
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
    private ngZone: NgZone // Injected NgZone
  ) {
    this.title.setTitle('Login - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Login - Flashyre',
      },
      {
        property: 'og:image',
        content: 'your-og-image-url',
      },
    ]);
  }

  ngOnInit() {
    // Capture returnUrl query param or default to candidate login page
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/login';
  }

  onLoginSubmit(response: any) {
    this.spinner.show();

    if (response.message === 'Login successful' && response.access) {
      console.log("Login response: ", response);
      
      // Store Data
      localStorage.setItem('jwtToken', response.access);
      localStorage.setItem('user_id', response.user_id); 
      localStorage.setItem('userType', response.role);
      
      if (response.is_superuser) {
        localStorage.setItem('isSuperUser', 'true');
      } else {
        localStorage.removeItem('isSuperUser');
      }
      
      // Attempt to fetch profile (Mostly for candidates)
      this.userProfileService.fetchUserProfile().subscribe({
        next: () => {
          this.errorMessage = '';
          this.navigateBasedOnRole(response);
        },
        error: (profileError) => {
          console.error('Error fetching profile', profileError);
          // If profile fetch fails (common for non-candidates), still navigate based on role
          this.navigateBasedOnRole(response);
        }
      });
    } else {
      this.errorMessage = response.error || 'Login failed';
      console.error('Login failed:', response);
    }
    this.spinner.hide();
  }

  navigateBasedOnRole(response: any) {
    // Wrap navigation in NgZone.run to prevent freezing/deadlocks during component destruction/init
    this.ngZone.run(() => {
      const role = response.role;
      const isSuperUser = response.is_superuser;

      if (role === 'admin') {
        if (isSuperUser) {
          this.router.navigate(['/recruiter-super-admin-analytical-module']);
        } else {
          this.router.navigate(['/recruiter-workflow-candidate']);
        }
      } else if (role === 'recruiter') {
        this.router.navigate(['/recruiter-workflow-requirement']);
      } else if (role === 'client') {
        // Client Home Page -> Requirement Workflow
        this.router.navigate(['/recruiter-workflow-requirement']);
      } else if (role === 'candidate') {
        this.router.navigate(['/candidate-home']);
      } else {
        this.router.navigate(['/']);
      }
    });
  }
}