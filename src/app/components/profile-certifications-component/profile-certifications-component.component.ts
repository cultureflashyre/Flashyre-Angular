// profile-certifications-component.component.ts

import { Component, Input, ContentChild, TemplateRef, OnInit, ViewChild, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService
import { environment } from '../../../environments/environment';
import { CertificationService } from 'src/app/services/certification.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'profile-certifications-component',
  templateUrl: './profile-certifications-component.component.html',
  styleUrls: ['./profile-certifications-component.component.css']
})
export class ProfileCertificationsComponent implements OnInit {
  private baseUrl = environment.apiUrl;

  @ContentChild('text1') text1: TemplateRef<any>;
  @ContentChild('text312') text312: TemplateRef<any>;
  @ContentChild('text1111') text1111: TemplateRef<any>;
  @ContentChild('text311') text311: TemplateRef<any>;
  @ContentChild('text1121') text1121: TemplateRef<any>;
  @ContentChild('text3121') text3121: TemplateRef<any>;
  @ContentChild('text11') text11: TemplateRef<any>;
  @Input() rootClassName: string = '';
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

  ngOnInit() {
    const today = new Date();
    this.todayDate = today.toISOString().split('T')[0];
  }

  get certifications() {
    return this.certificationForm.get('certifications') as FormArray;
  }

  createCertificationGroup(): FormGroup {
    // MODIFIED: Removed Validators.required from issued_date and credentials
    return this.fb.group({
      certificate_name: ['', Validators.required],
      issuing_institute: ['', Validators.required],
      issued_date: [''], // Was ['', Validators.required]
      renewal_date: [''],
      credentials: [''], // Was ['', Validators.required]
    });
  }

  addCertification() {
    this.certifications.push(this.createCertificationGroup());
    // Wait for the DOM to update, then scroll to the last block within the container
    setTimeout(() => {
      this.scrollToLastCertification();
    }, 0);
  }

  removeCertification(index: number) {
    if (this.certifications.length > 1) {
      this.certifications.removeAt(index);
    }
  }

  scrollToLastCertification() {
    const blocks = this.certificationBlocks.toArray();
    if (blocks.length > 0 && this.scrollContainer) {
      const lastBlock = blocks[blocks.length - 1].nativeElement;
      const container = this.scrollContainer.nativeElement;
      const blockOffsetTop = lastBlock.offsetTop - container.offsetTop;
      container.scrollTo({
        top: blockOffsetTop,
        behavior: 'smooth'
      });
    }
  }

  updateRenewalDateMin(index: number) {
    const certification = this.certifications.at(index) as FormGroup;
    const issuedDate = certification.get('issued_date')?.value;
    const renewalDateControl = certification.get('renewal_date');

    if (issuedDate) {
      const renewalDate = renewalDateControl?.value;
      const today = new Date(this.todayDate);
      const issued = new Date(issuedDate);
      const renewal = renewalDate ? new Date(renewalDate) : null;
      if (renewal && (renewal < issued || renewal > today)) {
        renewalDateControl?.setValue('');
      }
    }
  }

  // Method to handle form submission
  submitCertification(): void {
    console.log('Certification form submitted:', this.certificationForm.value);
  }

  saveCertifications(): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (this.certificationForm.valid) {
        // MODIFICATION: Filter out empty optional fields before sending to the backend.
        // This prevents sending empty strings for date fields, which the backend
        // might reject. Sending `null` or omitting the key is safer.
        const formValue = this.certificationForm.value.certifications;
        const data = formValue.map((cert: any) => ({
          ...cert,
          issued_date: cert.issued_date || null,
          renewal_date: cert.renewal_date || null,
          credentials: cert.credentials || null,
        }));

        const requests = data.map((cert: any) => 
          this.certificationService.saveCertification(cert)
        );
  
        this.spinner.show();
  
        try {
          await forkJoin(requests).toPromise();
          this.certificationForm.reset();
          this.certifications.clear();
          this.certifications.push(this.createCertificationGroup());
          console.log('All certifications saved successfully');
          resolve(true);
        } catch (error) {
          console.error('Error saving certifications:', error);
          alert('Error saving certifications: ' + (error.error?.detail || 'Unknown error'));
          resolve(false);
        } finally {
          this.spinner.hide();
        }
      } else {
        console.log('Certification form is invalid');
        alert('Please fill out all required certification fields correctly.');
        resolve(false);
      }
    });
  }
}