// Updated profile-employment-page.component.ts
import { Component, ViewChild } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { EmploymentService } from '../../services/employment.service';
import { ProfileEmploymentComponent } from '../../components/profile-employment-component/profile-employment-component.component';

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { NavbarForCandidateView1 } from 'src/app/components/navbar-for-candidate-view1/navbar-for-candidate-view1.component';
import { ProgressBarStep2 } from 'src/app/components/progress-bar-step-2/progress-bar-step-2.component';
import { ProfileCreationNavigation2 } from 'src/app/components/profile-creation-navigation2/profile-creation-navigation2.component';

@Component({
  selector: 'profile-employment-page',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    NavbarForCandidateView1, ProgressBarStep2,
    ProfileEmploymentComponent,
    ProfileCreationNavigation2,
  ],
  templateUrl: 'profile-employment-page.component.html',
  styleUrls: ['profile-employment-page.component.css'],
})
export class ProfileEmploymentPage {
  @ViewChild('employmentComponent') employmentComponent!: ProfileEmploymentComponent;

  constructor(
    private title: Title,
    private meta: Meta,
    private employmentService: EmploymentService,
    private router: Router
  ) {
    this.title.setTitle('Profile-Employment-Page - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Profile-Employment-Page - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  saveAndNext() {
    if (this.employmentComponent) {
      this.employmentComponent.saveAndNext();
    } else {
      console.error('Employment component not found');
      this.router.navigate(['/profile-education-page-duplicate']); // Navigate anyway if component is missing
    }
  }

  goToPrevious() {
    if (this.employmentComponent) {
      this.employmentComponent.goToPrevious();
    } else {
      console.error('Employment component not found');
      // Navigate to previous page
      this.router.navigate(['/previous-page-route']);
    }
  }

  skipToEducation() {
    // Direct implementation in the page component
    console.log('Skipping to education section');
    this.router.navigate(['/profile-education-page-duplicate']);
  }
}