import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Certification {
  certificate_name: string;
  issuing_institute: string;
  issued_date: string;
  renewal_date: string;
  credentials: string;
}

@Component({
  selector: 'profile-certifications-component',
  templateUrl: './profile-certifications-component.component.html',
  styleUrls: ['./profile-certifications-component.component.css'],
})
export class ProfileCertificationsComponent {
  @ContentChild('text1') text1: TemplateRef<any>;
  @ContentChild('text312') text312: TemplateRef<any>;
  @ContentChild('text12') text12: TemplateRef<any>;
  @ContentChild('text1111') text1111: TemplateRef<any>;
  @ContentChild('text311') text311: TemplateRef<any>;
  @ContentChild('text1121') text1121: TemplateRef<any>;
  @ContentChild('text3121') text3121: TemplateRef<any>;
  @ContentChild('text11') text11: TemplateRef<any>;
  @ContentChild('text112') text112: TemplateRef<any>;
  @ContentChild('text111') text111: TemplateRef<any>;
  @ContentChild('text') text: TemplateRef<any>;
  @ContentChild('text31') text31: TemplateRef<any>;
  @ContentChild('text3111') text3111: TemplateRef<any>;

  @Input() rootClassName: string = '';
  @Output() certificationData = new EventEmitter<Certification[]>();

  certifications: Certification[] = [
    {
      certificate_name: '',
      issuing_institute: '',
      issued_date: '',
      renewal_date: '',
      credentials: ''
    }
  ];

  private apiUrl = 'http://localhost:8000/api/certifications/';

  constructor(private http: HttpClient) {}

  addCertification() {
    this.certifications.push({
      certificate_name: '',
      issuing_institute: '',
      issued_date: '',
      renewal_date: '',
      credentials: ''
    });
    this.emitData();
  }

  removeCertification(index: number) {
    if (this.certifications.length > 1) {
      this.certifications.splice(index, 1);
      this.emitData();
    }
  }

  onFieldChange(index: number) {
    this.emitData();
  }

  onIssuedDateChange(index: number) {
    const cert = this.certifications[index];
    if (cert.issued_date) {
      const issuedDate = new Date(cert.issued_date);
      const today = new Date();
      if (issuedDate > today) {
        cert.issued_date = this.getTodayDate();
      }
      if (cert.renewal_date && new Date(cert.renewal_date) <= issuedDate) {
        cert.renewal_date = '';
      }
    }
    this.emitData();
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getMinRenewalDate(index: number): string {
    const cert = this.certifications[index];
    if (cert.issued_date) {
      const issuedDate = new Date(cert.issued_date);
      issuedDate.setDate(issuedDate.getDate() + 1);
      return issuedDate.toISOString().split('T')[0];
    }
    return this.getTodayDate();
  }

  emitData() {
    this.certificationData.emit(this.certifications);
  }

  saveCertifications() {
    this.certifications.forEach(cert => {
      if (cert.certificate_name && cert.issuing_institute && cert.issued_date && cert.credentials) {
        this.http.post(this.apiUrl, cert).subscribe(
          response => console.log('Certification saved:', response),
          error => console.error('Error saving certification:', error)
        );
      }
    });
  }
}