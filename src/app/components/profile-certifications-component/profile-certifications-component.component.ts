import { Component, Input, ContentChild, TemplateRef, OnInit, ViewChild, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../../environments/environment';
import { CertificationService } from 'src/app/services/certification.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'profile-certifications-component',
  templateUrl: 'profile-certifications-component.component.html',
  styleUrls: ['profile-certifications-component.component.css'],
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

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient, 
    private spinner: NgxSpinnerService,
    private certificationService: CertificationService
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

  // Public method to create a certification form group
  public createCertificationGroup(data: any = {}): FormGroup {
    return this.fb.group({
      certificate_name: [data.certificate_name || '', Validators.required],
      issuing_institute: [data.issuing_institute || '', Validators.required],
      issued_date: [data.issued_date || '', Validators.required],
      renewal_date: [data.renewal_date || ''],
      credentials: [data.credentials || '', Validators.required],
    });
  }

  addCertification() {
    this.certifications.push(this.createCertificationGroup());
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
      } catch (error) {
        console.error('Error saving certifications:', error);
      } finally {
        this.spinner.hide();
      }
    } else {
      console.log('Form is invalid');
    }
  }
}