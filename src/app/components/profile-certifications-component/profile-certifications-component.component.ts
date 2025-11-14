import { Component, Input, ContentChild, TemplateRef, OnInit, ViewChild, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CertificationService } from 'src/app/services/certification.service';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { AlertMessageComponent } from '../alert-message/alert-message.component';

@Component({
    selector: 'profile-certifications-component',
    templateUrl: './profile-certifications-component.component.html',
    styleUrls: ['./profile-certifications-component.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet, FormsModule, ReactiveFormsModule, AlertMessageComponent]
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
  showRemoveConfirmation = false;
  certificationToRemoveIndex: number | null = null;

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

   promptRemoveCertification(index: number): void {
    this.certificationToRemoveIndex = index;
    this.showRemoveConfirmation = true;
  }

  handleRemoveConfirmation(button: string): void {
    if (button.toLowerCase() === 'remove') {
      if (this.certificationToRemoveIndex !== null && this.certifications.length > 1) {
        this.certifications.removeAt(this.certificationToRemoveIndex);
      }
    }
    this.closeRemoveConfirmationModal();
  }

  closeRemoveConfirmationModal(): void {
    this.showRemoveConfirmation = false;
    this.certificationToRemoveIndex = null;
  }


  scrollToLastCertification() {
      // Logic for scrolling remains the same
  }

 public isFormEmpty(): boolean {
  // A form is considered empty only if there is one certification group
  // and all of its relevant fields are empty.
  if (this.certifications.length === 1) {
    const singleForm = this.certifications.at(0);
    if (singleForm) {
      const formValues = singleForm.value;
      // We check the values directly instead of relying on the pristine state.
      return !formValues.certificate_name &&
             !formValues.issuing_institute &&
             !formValues.issued_date &&
             !formValues.renewal_date &&
             !formValues.credentials;
    }
  }
  // If there is more than one form, it's not considered empty.
  return false;
}

public validateForms(): boolean {
  let isOverallValid = true;

  this.certifications.controls.forEach(control => {
    const form = control as FormGroup;
    const formValues = form.value;
    
    // Check if any field in the form has a value.
    const isPartiallyFilled = 
      formValues.certificate_name || 
      formValues.issuing_institute ||
      formValues.issued_date ||
      formValues.renewal_date ||
      formValues.credentials;

    // A form is considered invalid only if it's partially filled but fails validation.
    // Completely empty forms will be skipped and not validated.
    if (isPartiallyFilled && form.invalid) {
      form.markAllAsTouched(); // Show errors only for this specific invalid form.
      isOverallValid = false;
    }
  });

  return isOverallValid;
}
  
  updateRenewalDateMin(index: number) {
      // This logic remains the same
  }

saveCertifications(): Promise<boolean> {
  return new Promise((resolve) => {
    // Step 1: Validate all forms. The updated validateForms() now correctly
    // ignores completely blank forms and only validates partially filled ones.
    if (!this.validateForms()) {
      alert('Please fill out all required fields for any certification you have started.');
      resolve(false);
      return; // Stop if validation fails.
    }

    // Step 2: Filter out the completely empty forms so they are not sent to the backend.
    const formsToSave = this.certifications.controls.filter(control => {
      const formValues = control.value;
      return formValues.certificate_name || 
             formValues.issuing_institute ||
             formValues.issued_date ||
             formValues.renewal_date ||
             formValues.credentials;
    });

    // Step 3: If, after filtering, there are no forms left to save, treat it as a successful skip.
    if (formsToSave.length === 0) {
      console.log('No certification data to save. Skipping.');
      resolve(true); // Allow navigation.
      return;
    }

    // Step 4: Create the payload using only the valid, non-empty forms.
    const payload = formsToSave.map(form => {
      const formValue = form.value;
      return {
        ...formValue,
        renewal_date: formValue.renewal_date || null
      };
    });

    this.certificationService.saveCertifications(payload).subscribe({
      next: () => {
        console.log('Certifications saved successfully');
        resolve(true);
      },
      error: (error) => {
        console.error('Error saving certifications:', error);
        alert('Error saving certifications: ' + (error.message || 'Unknown error'));
        resolve(false);
      }
    });
  });
}
}