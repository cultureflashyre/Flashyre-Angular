import { Component } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LoggerService } from '../../services/logger.service'; // Adjust path

@Component({
  selector: 'profile-basic-information',
  templateUrl: 'profile-basic-information.component.html',
  styleUrls: ['profile-basic-information.component.css'],
})
export class ProfileBasicInformation {
  constructor(
    private title: Title,
    private meta: Meta,
    private http: HttpClient,
    private router: Router,
    private logger: LoggerService
  ) {
    this.title.setTitle('Profile-Basic-Information - Flashyre');
    this.meta.addTags([
      { property: 'og:title', content: 'Profile-Basic-Information - Flashyre' },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
    this.logger.debug('ProfileBasicInformation component initialized');
  }

  onSaveAndNext(formData: FormData): void {
    this.logger.debug('Saving profile data:', formData);
    this.http.post('http://localhost:8000/api/profile/', formData).subscribe(
      (response) => {
        this.logger.info('Profile saved successfully', response);
        this.router.navigate(['/next-page']); // Replace with actual next page route
      },
      (error) => {
        this.logger.error('Profile save failed', error);
        alert('Failed to save profile: ' + (error.error?.email || 'Unknown error'));
      }
    );
  }

  onSkip(): void {
    this.logger.debug('Skipping profile basic information');
    this.router.navigate(['/next-page']); // Replace with actual next page route
  }
}