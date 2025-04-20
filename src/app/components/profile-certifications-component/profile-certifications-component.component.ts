import { Component, Input, ContentChild, TemplateRef, OnInit, ViewChild, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService

@Component({
  selector: 'profile-certifications-component',
  templateUrl: 'profile-certifications-component.component.html',
  styleUrls: ['profile-certifications-component.component.css'],
})
export class ProfileCertificationsComponent implements OnInit {
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
    private http: HttpClient, private spinner: NgxSpinnerService
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
    return this.fb.group({
      certificate_name: ['', Validators.required],
      issuing_institute: ['', Validators.required],
      issued_date: ['', Validators.required],
      renewal_date: [''],
      credentials: ['', Validators.required],
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

  async submitCertification(): Promise<void> {
    if (this.certificationForm.valid) {
      const data = this.certificationForm.value.certifications;
      const promises = data.map((cert: any) =>
        this.http.post('http://localhost:8000/api/certifications/', cert, { withCredentials: true }).toPromise()
          .then((response) => {
            console.log('Certification saved:', response);
          })
          .catch((error) => {
            console.error('Error saving certification:', error);
            throw error;
          })
      );

      // Show spinner before making requests
      this.spinner.show();

      try {
        await Promise.all(promises);
        this.certificationForm.reset();
        this.certifications.clear();
        this.certifications.push(this.createCertificationGroup());
      } catch (error) {
        // Error already logged in catch block above
      } finally {
        // Hide spinner after all requests are completed
        this.spinner.hide();
      }
    } else {
      console.log('Form is invalid');
    }
  }
}