import { Component, Input, ContentChild, TemplateRef, OnInit, ViewChild, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CertificationService } from 'src/app/services/certification.service';

@Component({
  selector: 'profile-certifications-component',
  templateUrl: './profile-certifications-component.component.html',
  styleUrls: ['./profile-certifications-component.component.css']
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

  constructor(private fb: FormBuilder, private certificationService: CertificationService) {
    this.certificationForm = this.fb.group({
      certifications: this.fb.array([]), // Initialize as empty array
    });
  }

  ngOnInit() {
    this.todayDate = new Date().toISOString().split('T')[0];
    this.loadCertificationsFromLocalStorage();
  }

  loadCertificationsFromLocalStorage(): void {
    const userProfileString = localStorage.getItem('userProfile');
    if (userProfileString) {
      try {
        const userProfile = JSON.parse(userProfileString);
        if (userProfile.certifications && Array.isArray(userProfile.certifications) && userProfile.certifications.length > 0) {
          this.certifications.clear();
          userProfile.certifications.forEach((cert: any) => {
            const formGroup = this.createCertificationGroup();
            formGroup.patchValue({
              certifications_id: cert.certifications_id || null, // <<< POPULATE THE ID
              certificate_name: cert.certificate_name || '',
              issuing_institute: cert.issuing_institute || '',
              issued_date: cert.issued_date || '',
              renewal_date: cert.renewal_date || '',
              credentials: cert.credentials || ''
            });
            this.certifications.push(formGroup);
          });
        } else {
          // If profile exists but no certs, add one empty form
          this.certifications.push(this.createCertificationGroup());
        }
      } catch (error) {
        console.error('Error parsing userProfile from localStorage', error);
        this.certifications.push(this.createCertificationGroup());
      }
    } else {
        // If no profile, add one empty form
        this.certifications.push(this.createCertificationGroup());
    }
  }

  get certifications() {
    return this.certificationForm.get('certifications') as FormArray;
  }

  createCertificationGroup(): FormGroup {
    return this.fb.group({
      certifications_id: [null], // <<< ADD THE ID CONTROL
      certificate_name: ['', [Validators.required, Validators.pattern('.*[a-zA-Z]+.*')]],
      issuing_institute: ['', [Validators.required, Validators.pattern('.*[a-zA-Z]+.*')]],
      issued_date: ['', Validators.required],
      renewal_date: [''],
      credentials: ['', [Validators.required, Validators.pattern('.*[a-zA-Z]+.*')]],
    });
  }

  addCertification() {
    this.certifications.push(this.createCertificationGroup());
    setTimeout(() => this.scrollToLastCertification(), 0);
  }

  removeCertification(index: number) {
    if (this.certifications.length > 1) {
      if(window.confirm('Are you sure to remove')) {
        this.certifications.removeAt(index);
      }
    }
  }

  scrollToLastCertification() {
      // Logic for scrolling remains the same
  }

   public isFormEmpty(): boolean {
    // The form is empty if there is only one certification form group
    // and the user has not interacted with it yet (it's "pristine").
    if (this.certifications.length === 1) {
      const firstCertForm = this.certifications.at(0);
      return firstCertForm ? firstCertForm.pristine : true;
    }
    // If there is more than one form, it's not empty.
    return false;
  }
  
  updateRenewalDateMin(index: number) {
      // This logic remains the same
  }

  saveCertifications(): Promise<boolean> {
    return new Promise((resolve) => {
      this.certificationForm.markAllAsTouched(); // Trigger validation messages on all fields

      if (this.certificationForm.valid) {
        // The payload is now the entire array of certification values
        const payload = this.certificationForm.value.certifications.map((cert: any) => ({
            ...cert,
            renewal_date: cert.renewal_date || null // Ensure empty renewal date is sent as null
        }));

        this.certificationService.saveCertifications(payload).subscribe({
          next: () => {
            console.log('All certifications saved successfully');
            // We don't need to reset the form here, the parent component handles navigation.
            // The latest data will be loaded from localStorage on next init.
            resolve(true);
          },
          error: (error) => {
            console.error('Error saving certifications:', error);
            alert('Error saving certifications: ' + (error.message || 'Unknown error'));
            resolve(false);
          }
        });
      } else {
        console.log('Certification form is invalid');
        alert('Please fill out all required certification fields correctly.');
        resolve(false);
      }
    });
  }
}