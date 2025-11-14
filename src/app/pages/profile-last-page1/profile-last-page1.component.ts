import { Component } from '@angular/core'
 import { Title, Meta } from '@angular/platform-browser'
 import { Router } from '@angular/router';
 import { UserProfileService } from '../../services/user-profile.service'; 

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { NavbarForCandidateView1 } from 'src/app/components/navbar-for-candidate-view1/navbar-for-candidate-view1.component';
import { ProgressBarStep5 } from 'src/app/components/progress-bar-step-5/progress-bar-step-5.component';
 @Component({
   selector: 'profile-last-page1',
   standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    NavbarForCandidateView1, ProgressBarStep5,
  ],
   templateUrl: 'profile-last-page1.component.html',
   styleUrls: ['profile-last-page1.component.css'],
 })
 export class ProfileLastPage1 {
   constructor(
    private title: Title, 
    private meta: Meta, 
    private router: Router,
    private userProfileService: UserProfileService
  ) {
     this.title.setTitle('Profile-Last-Page1 - Flashyre')
     this.meta.addTags([
       {
         property: 'og:title',
         content: 'Profile-Last-Page1 - Flashyre',
       },
       {
         property: 'og:image',
         content:
           'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
       },
     ])
   }

   ngAfterViewInit() {
    console.log('Displaying profile last page1, buffer-name component');
    
    // Fetch latest data from the server and refresh local storage
    this.userProfileService.fetchUserProfile().subscribe({
      next: (profile) => {
        console.log('Profile refreshed:', profile);
        // Navigate after successful refresh
        setTimeout(() => {
          this.router.navigate(['/candidate-assessment']);
        }, 4000);
      },
      error: (err) => {
        console.error('Failed to refresh profile:', err);
        // Navigate even if refresh fails (optional)
        setTimeout(() => {
          this.router.navigate(['/candidate-assessment']);
        }, 4000);
      }
    });
  }
  
 }