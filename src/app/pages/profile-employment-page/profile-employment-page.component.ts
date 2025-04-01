import { Component, ViewChild } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'
import { Router } from '@angular/router'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { ProfileEmploymentComponent } from '../../components/profile-employment-component/profile-employment-component.component'

@Component({
  selector: 'profile-employment-page',
  templateUrl: 'profile-employment-page.component.html',
  styleUrls: ['profile-employment-page.component.css'],
})
export class ProfileEmploymentPage {
  @ViewChild('employmentComponent') employmentComponent: ProfileEmploymentComponent;

  constructor(
    private title: Title, 
    private meta: Meta,
    private router: Router,
    private http: HttpClient
  ) {
    this.title.setTitle('Profile-Employment-Page - Flashyre')
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
    ])
  }

  skip() {
    this.router.navigate(['/profile-education-page-duplicate']);
  }

  goToPrevious() {
    this.router.navigate(['/profile-basic-information']);
  }

  saveAndNext() {
    const employmentData = this.employmentComponent.employments.map(emp => ({
      job_title: emp.jobTitle,
      company_name: emp.companyName,
      start_date: emp.startDate,
      end_date: emp.endDate || null,
      job_details: emp.jobDetails
    }));

    console.log('Employment data to send:', employmentData);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    const apiUrl = 'http://localhost:8000/employment/';  // Ensure this matches your Django server

    // Send each employment entry separately
    employmentData.forEach((data, index) => {
      console.log(`Sending employment entry ${index + 1}:`, data);
      this.http.post(apiUrl, data, { 
        headers: headers,
        withCredentials: true  // Include cookies for session authentication
      }).subscribe(
        response => {
          console.log('Employment data saved successfully:', response);
        },
        error => {
          console.error('Error saving employment data:', error);
        }
      );
    });

    this.router.navigate(['/profile-education-page-duplicate']);
  }
}