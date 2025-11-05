import { Component, OnInit, ViewChildren, QueryList, ElementRef, Input, ContentChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EducationService } from '../../services/education.service';
import { forkJoin } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

interface DropdownItem {
  id: number;
  name: string;
  [key: string]: any;
}

interface ReferenceData {
  colleges: DropdownItem[];
  education_levels: DropdownItem[];
  courses: DropdownItem[];
  specializations: DropdownItem[];
}

@Component({
  selector: 'profile-education-component',
  templateUrl: './profile-education-component.component.html',
  styleUrls: ['./profile-education-component.component.css']
})
export class ProfileEducationComponent implements OnInit {
  @ContentChild('text') text: TemplateRef<any>;
  @ContentChild('text1') text1: TemplateRef<any>;
  @ContentChild('text2') text2: TemplateRef<any>;
  @ContentChild('text111') text111: TemplateRef<any>;
  @ContentChild('text112') text112: TemplateRef<any>;
  @ContentChild('text1111') text1111: TemplateRef<any>;
  @ContentChild('text1112') text1112: TemplateRef<any>;

  @Input() rootClassName: string = '';
  @ViewChildren('educationFormInstance') educationFormInstances: QueryList<ElementRef>;

  educationForms: FormGroup[] = [];
  universities: DropdownItem[] = [];
  educationLevels: DropdownItem[] = [];
  courses: DropdownItem[] = [];
  specializations: DropdownItem[] = [];
  todayDate: string = new Date().toISOString().split('T')[0];
  isLoading: boolean = false;
  errorMessage: string | null = null;

  showRemoveConfirmation = false;
  formToRemoveIndex: number | null = null;

  constructor(
    private fb: FormBuilder,
    private educationService: EducationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const userProfileString = localStorage.getItem('userProfile');

    // Always fetch reference data first
    this.educationService.getReferenceData().subscribe({
      next: (data: ReferenceData) => {
        this.universities = data.colleges;
        this.educationLevels = data.education_levels;
        this.courses = data.courses;
        this.specializations = data.specializations;

        this.educationForms = []; // Reset forms array

        // Now that we have dropdown data, check for existing user profile data
        if (userProfileString) {
          try {
            const userProfile = JSON.parse(userProfileString);
            if (userProfile.educations && Array.isArray(userProfile.educations) && userProfile.educations.length > 0) {
              userProfile.educations.forEach((edu: any) => {
                const form = this.createEducationForm();
                form.patchValue({
                  id: edu.id || null, // <<< POPULATE THE ID
                  startDate: edu.start_date || '',
                  endDate: edu.end_date || '',
                  university: this.getDropdownIdByName(this.universities, edu.university),
                  educationLevel: this.getDropdownIdByName(this.educationLevels, edu.education_level),
                  course: this.getDropdownIdByName(this.courses, edu.course),
                  specialization: this.getDropdownIdByName(this.specializations, edu.specialization),
                });
                this.educationForms.push(form);
              });
            } else {
              // If user has a profile but no educations, add one empty form
              this.addNewForm();
            }
          } catch (e) {
            console.warn('Error parsing userProfile from localStorage', e);
            this.addNewForm();
          }
        } else {
          // If no profile exists at all, add one empty form
          this.addNewForm();
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load dropdown data. Please try again.';
        this.isLoading = false;
      }
    });
  }
  
  private getDropdownIdByName(dropdownList: DropdownItem[], name: string): number | '' {
    if (!name) return '';
    const item = dropdownList.find(d => d.name.toLowerCase() === name.toLowerCase());
    return item ? item.id : '';
  }

  private createEducationForm(): FormGroup {
    return this.fb.group({
      id: [null], // <<< ADD THE ID CONTROL
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      university: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      educationLevel: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      course: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      specialization: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]]
    }, { validators: this.dateRangeValidator });
  }

  private dateRangeValidator(form: FormGroup): { [key: string]: any } | null {
    const startDate = form.get('startDate')?.value;
    const endDate = form.get('endDate')?.value;
    return startDate && endDate && new Date(endDate) < new Date(startDate)
      ? { dateRangeInvalid: true }
      : null;
  }

  public isFormEmpty(): boolean {
    // The form is empty if there is only one education form group
    // and all of its fields are empty.
    if (this.educationForms.length === 1) {
      const singleForm = this.educationForms[0];
      const formValues = singleForm.value;
      
      // We check the values directly instead of relying on the pristine state.
      return !formValues.startDate && 
             !formValues.endDate &&
             !formValues.university &&
             !formValues.educationLevel &&
             !formValues.course &&
             !formValues.specialization;
    }
    // If there is more than one form, it's not empty.
    return false;
  }

public validateForms(): boolean {
  let isOverallValid = true;

  for (const form of this.educationForms) {
    const formValues = form.value;
    // Check if any field in the form has a value.
    const isPartiallyFilled = 
      formValues.startDate || 
      formValues.endDate ||
      formValues.university ||
      formValues.educationLevel ||
      formValues.course ||
      formValues.specialization;

    // A form is considered invalid only if it's partially filled but fails validation.
    // Completely empty forms will be skipped.
    if (isPartiallyFilled && form.invalid) {
      form.markAllAsTouched(); // Show errors only for this specific invalid form.
      isOverallValid = false;
    }
  }

  return isOverallValid;
}

  addNewForm(): void {
    this.educationForms.push(this.createEducationForm());
    setTimeout(() => {
      const lastForm = this.educationFormInstances.last;
      if (lastForm) {
        lastForm.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  }

  // removeForm(index: number): void {
  //   if (window.confirm('Are you sure to remove')) {
  //     this.educationForms.splice(index, 1);
  //   }
  // }

promptRemoveForm(index: number): void {
    this.formToRemoveIndex = index;
    this.showRemoveConfirmation = true;
  }

  handleRemoveConfirmation(button: string): void {
    if (button.toLowerCase() === 'remove') {
      if (this.formToRemoveIndex !== null) {
        this.educationForms.splice(this.formToRemoveIndex, 1);
      }
    }
    this.closeRemoveConfirmationModal();
  }

  closeRemoveConfirmationModal(): void {
    this.showRemoveConfirmation = false;
    this.formToRemoveIndex = null;
  }


saveEducation(): Promise<boolean> {
  return new Promise((resolve) => {
    // Step 1: Validate all forms. The updated validateForms() now correctly
    // ignores completely blank forms and only validates partially filled ones.
    if (!this.validateForms()) {
      resolve(false);
      return; // Stop if validation fails on a partially filled form.
    }

    // Step 2: Filter out the completely empty forms so they are not sent to the backend.
    const formsToSave = this.educationForms.filter(form => {
      const formValues = form.value;
      // This condition ensures we only include forms that have some data.
      return formValues.startDate || 
             formValues.endDate ||
             formValues.university ||
             formValues.educationLevel ||
             formValues.course ||
             formValues.specialization;
    });

    // Step 3: If there are no forms with data, treat it as a successful skip.
    if (formsToSave.length === 0) {
      console.log('No education data to save. Skipping.');
      resolve(true); // Allow navigation to the next page.
      return;
    }

    // Step 4: Create the payload using only the valid, non-empty forms.
    const payload = formsToSave.map(form => {
      const formValue = form.value;
      return {
        id: formValue.id,
        select_start_date: formValue.startDate || null,
        select_end_date: formValue.endDate || null,
        university: this.universities.find(u => u.id === +formValue.university)?.name,
        education_level: this.educationLevels.find(e => e.id === +formValue.educationLevel)?.name,
        course: this.courses.find(c => c.id === +formValue.course)?.name,
        specialization: this.specializations.find(s => s.id === +formValue.specialization)?.name
      };
    });

    console.log('Sending payload to backend:', payload);

    this.educationService.saveEducation(payload).subscribe({
      next: (response) => {
        console.log('All educations saved successfully:', response);
        this.errorMessage = null;
        resolve(true);
      },
      error: (error) => {
        console.error('Error saving educations:', error);
        this.errorMessage = error.message || 'An unknown error occurred while saving.';
        resolve(false);
      }
    });
  });
}

  goToPrevious(): void {
    this.router.navigate(['/profile-employment-page']);
  }

  skipToNextSection(): void {
    this.router.navigate(['/profile-certification-page']);
  }

  trackById(index: number, item: any): number {
    return item.id || index;
  }
}