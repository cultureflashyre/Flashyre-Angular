import { Component, ViewChild } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ProfileEducationComponent } from '../../components/profile-education-component/profile-education-component.component';

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { NavbarForCandidateView1 } from 'src/app/components/navbar-for-candidate-view1/navbar-for-candidate-view1.component';
import { ProgressBarStep3 } from 'src/app/components/progress-bar-step-3/progress-bar-step-3.component';
import { ProfileCreationNavigation2 } from 'src/app/components/profile-creation-navigation2/profile-creation-navigation2.component';

@Component({
  selector: 'profile-education-page-duplicate',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    NavbarForCandidateView1, ProgressBarStep3,
    ProfileEducationComponent,
    ProfileCreationNavigation2,
  ],
  templateUrl: 'profile-education-page-duplicate.component.html',
  styleUrls: ['profile-education-page-duplicate.component.css'],
})
export class ProfileEducationPageDuplicate {
  @ViewChild(ProfileEducationComponent) profileEducationComponent: ProfileEducationComponent;

  constructor(private title: Title, private meta: Meta, private router: Router) {
    this.title.setTitle('Profile-Education-Page-Duplicate - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Profile-Education-Page-Duplicate - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  saveAndNext() {
    // Implement your save logic here
    console.log('Saving education data and proceeding to next step');
    // After saving, navigate to the next page
    this.router.navigate(['/profile-certification-page']);
  }
  
  goToPrevious() {
    // Implement navigation to previous page
    console.log('Navigating to previous page');
    this.router.navigate(['/previous-page-route']);
  }
  
  skipToNextSection() {
    // Implement skip logic
    console.log('Skipping to next section');
    this.router.navigate(['/profile-certification-page']);
  }
  
}