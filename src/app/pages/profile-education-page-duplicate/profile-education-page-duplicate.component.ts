import { Component, ViewChild } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ProfileEducationComponent } from '../../components/profile-education-component/profile-education-component.component';
import { EducationService } from '../../services/education.service';

@Component({
  selector: 'profile-education-page-duplicate',
  templateUrl: 'profile-education-page-duplicate.component.html',
  styleUrls: ['profile-education-page-duplicate.component.css'],
})
export class ProfileEducationPageDuplicate {
  @ViewChild('educationComponent') educationComponent: ProfileEducationComponent;

  constructor(
    private title: Title, 
    private meta: Meta,
    private router: Router,
    private educationService: EducationService
  ) {
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

  goToPrevious() {
    this.router.navigate(['/profile-employment-page']);
  }

  skip() {
    this.router.navigate(['/profile-certification-page']);
  }

  saveAndNext() {
    // Get education data from the component
    const educationData = this.educationComponent.educations;
    
    // Format the data to match Django's expected format
    // Note: We're no longer setting user here as the backend will handle it
    const formattedData = educationData.map(education => ({
      select_start_date: education.startDate,
      select_end_date: education.endDate,
      university: education.university,
      education_level: education.level,
      course: education.course,
      specialization: education.specialization
    }));
    
    console.log('Sending education data:', formattedData);
    
    // Send the data to the backend
    this.educationService.addEducation(formattedData).subscribe(
      response => {
        console.log('Education saved successfully:', response);
        this.router.navigate(['/profile-certification-page']);
      },
      error => {
        console.error('Error saving education:', error);
        // You could add an error message for the user here
        alert('Error saving education data. Please try again.');
      }
    );
  }
}