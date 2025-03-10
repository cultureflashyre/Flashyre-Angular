import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ProfileCertificationsComponent } from '../../components/profile-certifications-component/profile-certifications-component.component'; // Adjust the import path as needed

@Component({
  selector: 'profile-certification-page',
  templateUrl: 'profile-certification-page.component.html',
  styleUrls: ['profile-certification-page.component.css'],
})
export class ProfileCertificationPage implements AfterViewInit {
  @ViewChild('certificationsComponent', { static: false }) certificationsComponent!: ProfileCertificationsComponent;

  constructor(private title: Title, private meta: Meta, private router: Router) {
    this.title.setTitle('Profile-Certification-Page - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Profile-Certification-Page - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  ngAfterViewInit() {
    console.log('CertificationsComponent:', this.certificationsComponent);
  }

  async saveAndNext() {
    if (this.certificationsComponent) {
      console.log('Calling submitCertification');
      await this.certificationsComponent.submitCertification();
      console.log('Submission complete, navigating...');
      this.router.navigate(['/profile-last-page1']);
    } else {
      console.error('CertificationsComponent not initialized');
    }
  }

  goToPrevious() {
    console.log('Navigating to Previous');
    this.router.navigate(['/profile-education-page-duplicate']);
  }

  skipToEmployment() {
    console.log('Skipping to Employment');
    this.router.navigate(['/profile-last-page1']);
  }
}