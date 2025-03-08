import { Component, ViewChild } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ProfileEducationComponent } from '../../components/profile-education-component/profile-education-component.component';

@Component({
  selector: 'profile-education-page-duplicate',
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
    if (this.profileEducationComponent) {
      this.profileEducationComponent.saveAll().subscribe({
        next: () => {
          console.log('All educations saved successfully');
          this.router.navigate(['/profile-certification-page']);
        },
        error: (error) => {
          console.error('Error saving educations:', error);
          // Optionally, display an error message to the user (e.g., using a toast service)
        }
      });
    } else {
      console.error('ProfileEducationComponent not found');
      this.router.navigate(['/profile-certification-page']); // Navigate anyway if component is missing
    }
  }

  goToPrevious() {
    this.router.navigate(['/profile-employment-page']);
  }

  skipToNextSection() {
    console.log('Skipping to next section');
    this.router.navigate(['/profile-certification-page']);
  }
}