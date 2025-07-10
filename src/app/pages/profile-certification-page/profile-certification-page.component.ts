import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'profile-certification-page',
  templateUrl: './profile-certification-page.component.html',
  styleUrls: ['./profile-certification-page.component.css'],
})
export class ProfileCertificationPage implements OnInit {
  certifications: any[] = [];
  showForm: boolean = false;
  newCertification = {
    title: '',
    issuing_organization: '',
    issue_date: '',
    expiry_date: '',
    credential_id: '',
    credential_url: ''
  };

  constructor(
    private title: Title,
    private meta: Meta,
    private http: HttpClient,
    private router: Router
  ) {
    this.title.setTitle('Profile-Certification-Page - Flashyre');
    this.meta.addTags([
      { property: 'og:title', content: 'Profile-Certification-Page - Flashyre' },
      { 
        property: 'og:image', 
        content: 'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original'
      },
    ]);
  }

  ngOnInit() {
    this.loadCertifications();
  }

  loadCertifications() {
    this.http.get('/api/profile/certifications/').subscribe(
      (data: any) => {
        this.certifications = data;
      },
      error => {
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    );
  }

  saveCertification() {
    this.http.post('/api/profile/certifications/', this.newCertification).subscribe(
      (response: any) => {
        this.certifications.push(response);
        this.resetForm();
        this.showForm = false;
      },
      (error) => {
        console.error('Error saving certification:', error);
      }
    );
  }

  deleteCertification(certId: number) {
    this.http.delete(`/api/profile/certifications/${certId}/`).subscribe(
      () => {
        this.certifications = this.certifications.filter(cert => cert.id !== certId);
      },
      (error) => {
        console.error('Error deleting certification:', error);
      }
    );
  }

  resetForm() {
    this.newCertification = {
      title: '',
      issuing_organization: '',
      issue_date: '',
      expiry_date: '',
      credential_id: '',
      credential_url: ''
    };
  }

  saveAndNext() {
    if (this.showForm && this.newCertification.title) {
      this.saveCertification();
    }
    // Add navigation to next page
    this.router.navigate(['/next-profile-step']);
  }

  goToPrevious() {
    // Add navigation to previous page
    this.router.navigate(['/previous-profile-step']);
  }

  skip() {
    // Add navigation to next page without saving
    this.router.navigate(['/next-profile-step']);
  }

  skipToEmployment() {
    console.log('Skipping to Employment');
    this.router.navigate(['/profile-last-page1']);
  }
}