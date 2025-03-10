import { Component, ViewChild } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router'; // Import Router
import { EmploymentService } from '../../services/employment.service';
import { ProfileEmploymentComponent } from '../../components/profile-employment-component/profile-employment-component.component';

@Component({
  selector: 'profile-employment-page',
  templateUrl: 'profile-employment-page.component.html',
  styleUrls: ['profile-employment-page.component.css'],
})
export class ProfileEmploymentPage {
  @ViewChild('employmentComponent') employmentComponent!: ProfileEmploymentComponent;

  constructor(
    private title: Title,
    private meta: Meta,
    private employmentService: EmploymentService,
    private router: Router // Inject Router
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
    const positions = this.employmentComponent.getPositions();
    this.employmentService.saveEmployment(positions).subscribe(
      (response) => {
        console.log('Employment saved successfully:', response);
        this.employmentComponent.resetForm(); // Reset form after saving
        this.router.navigate(['/profile-education-page-duplicate']); // Redirect to profile-education-page-duplicate
      },
      (error) => {
        console.error('Error saving employment:', error);
      }
    );
  }

  goToPrevious() {
    this.router.navigate(['/profile-basic-information']);
  }

  skipToEducation() {
    this.router.navigate(['/profile-education-page-duplicate']);
  }

  // Optional: Keep this if you still need it for other purposes
  onEmploymentSubmitted(positions: any[]) {
    this.employmentService.saveEmployment(positions).subscribe(
      (response) => {
        console.log('Employment saved successfully:', response);
      },
      (error) => {
        console.error('Error saving employment:', error);
      }
    );
  }
}
