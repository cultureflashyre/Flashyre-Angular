import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService
import { environment } from '../../../environments/environment';
import { CertificationService } from 'src/app/services/certification.service';
import { forkJoin } from 'rxjs';


@Component({
  selector: 'profile-certifications-component',
  templateUrl: './profile-certifications-component.component.html',
  styleUrls: ['./profile-certifications-component.component.css'],
})

export class ProfileCertificationsComponent implements OnInit {
  private baseUrl = environment.apiUrl;


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


  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;
  @ViewChildren('certificationBlock') certificationBlocks!: QueryList<ElementRef>;

  certificationForm: FormGroup;
  todayDate: string;

  constructor(private fb: FormBuilder, 
    private http: HttpClient, private spinner: NgxSpinnerService,
    private certificationService: CertificationService,
  ) {
    this.certificationForm = this.fb.group({
      certifications: this.fb.array([this.createCertificationGroup()]),
    });
  }


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

  async submitCertification(): Promise<void> {
    if (this.certificationForm.valid) {
      const data = this.certificationForm.value.certifications;
      const requests = data.map((cert: any) => 
        this.certificationService.saveCertification(cert)
      );

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

      try {
        await forkJoin(requests).toPromise(); // Wait for all requests to complete
        this.certificationForm.reset();
        this.certifications.clear();
        this.certifications.push(this.createCertificationGroup());
        console.log('All certifications saved successfully');
      } catch (error) {
        console.error('Error saving certifications:', error);
        // Handle error accordingly, e.g., show a notification to the user
      } finally {
        // Hide spinner after all requests are completed
        this.spinner.hide();
      }
    });
  }
}