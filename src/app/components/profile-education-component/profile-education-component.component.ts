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

  constructor(
    private fb: FormBuilder,
    private educationService: EducationService,
    private router: Router
  ) {}

ngOnInit(): void {
  this.isLoading = true;
  this.errorMessage = null;

  const userProfileString = localStorage.getItem('userProfile');
  if (userProfileString) {
    try {
      const userProfile = JSON.parse(userProfileString);
      if (userProfile.educations && Array.isArray(userProfile.educations) && userProfile.educations.length > 0) {
        // Load reference data first
        this.educationService.getReferenceData().subscribe({
          next: (data: ReferenceData) => {
            this.universities = data.colleges;
            this.educationLevels = data.education_levels;
            this.courses = data.courses;
            this.specializations = data.specializations;

            this.educationForms = []; // reset

            userProfile.educations.forEach((edu: any) => {
              const form = this.createEducationForm();
              form.patchValue({
                startDate: edu.start_date || '',
                endDate: edu.end_date || '',
                university: this.getDropdownIdByName(this.universities, edu.university),
                educationLevel: this.getDropdownIdByName(this.educationLevels, edu.education_level),
                course: this.getDropdownIdByName(this.courses, edu.course),
                specialization: this.getDropdownIdByName(this.specializations, edu.specialization),
              });
              this.educationForms.push(form);
            });

            this.isLoading = false;
          },
          error: (err) => {
            this.errorMessage = 'Failed to load dropdown data';
            this.addNewForm();
            this.isLoading = false;
          }
        });
        return;
      }
    } catch (e) {
      console.warn('Error parsing userProfile from localStorage', e);
    }
  }

  // Fallback for no localStorage data or errors
  this.loadReferenceData();
}

  loadReferenceData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.educationService.getReferenceData().pipe(
      tap((data: ReferenceData) => {
        console.log('Reference data received:', data);
        this.universities = data.colleges;
        this.educationLevels = data.education_levels;
        this.courses = data.courses;
        this.specializations = data.specializations;

        this.addNewForm();
      }),
      catchError(error => {
        this.errorMessage = error.message || 'Failed to load dropdown data';
        this.addNewForm();
        return [];
      })
    ).subscribe({
      complete: () => (this.isLoading = false)
    });
  }

private getDropdownIdByName(dropdownList: DropdownItem[], name: string): number | '' {
  if (!name) return '';
  const item = dropdownList.find(d => d.name === name);
  return item ? item.id : '';
}

  private createEducationForm(): FormGroup {
    return this.fb.group({
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

  addNewForm(): void {
    this.educationForms.push(this.createEducationForm());
    setTimeout(() => {
      const lastForm = this.educationFormInstances.last;
      if (lastForm) {
        lastForm.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  }

  removeForm(index: number): void {
    this.educationForms.splice(index, 1);
  }

  saveEducation(): Promise<boolean> {
    return new Promise((resolve) => {
      const validForms = this.educationForms.filter(form => form.valid);
      if (!validForms.length) {
        console.log('No valid forms to save');
        this.errorMessage = 'Please fill out all required fields correctly.';
        resolve(false);
        return;
      }

      const saveObservables = validForms.map(form => {
        console.log('Raw form values:', form.value);

        // Validate that all dropdown fields have valid IDs
        if (!form.value.university || !form.value.educationLevel || !form.value.course || !form.value.specialization) {
          console.error('Invalid or missing dropdown selections:', form.value);
          this.errorMessage = 'Please select valid options for all dropdowns.';
          return [];
        }

        // Map IDs to names
        const university = this.universities.find(u => u.id === +form.value.university)?.name;
        const educationLevel = this.educationLevels.find(e => e.id === +form.value.educationLevel)?.name;
        const course = this.courses.find(c => c.id === +form.value.course)?.name;
        const specialization = this.specializations.find(s => s.id === +form.value.specialization)?.name;

        // Check if any mapped value is undefined
        if (!university || !educationLevel || !course || !specialization) {
          console.error('Invalid mapped values:', { university, educationLevel, course, specialization });
          this.errorMessage = 'One or more selected options are invalid.';
          return [];
        }

        const data = {
          select_start_date: form.value.startDate,
          select_end_date: form.value.endDate,
          university: university,
          education_level: educationLevel,
          course: course,
          specialization: specialization
        };

        console.log('Sending data to backend:', JSON.stringify(data, null, 2));
        return this.educationService.addEducation(data).pipe(
          catchError(error => {
            console.error('Error saving form:', error);
            let errorMessage = 'Failed to save education data';
            try {
              const parsedError = JSON.parse(error.message);
              errorMessage = typeof parsedError === 'object' ? Object.values(parsedError).join('; ') : parsedError;
            } catch (e) {
              errorMessage = error.message || 'Unknown error occurred';
            }
            this.errorMessage = errorMessage;
            return [];
          })
        );
      });

      forkJoin(saveObservables).subscribe({
        next: () => {
          console.log('All educations saved successfully');
          this.errorMessage = null;
          resolve(true);
        },
        error: (error) => {
          console.error('Error saving educations:', error);
          let errorMessage = 'Failed to save education data';
          try {
            const parsedError = JSON.parse(error.message);
            errorMessage = typeof parsedError === 'object' ? Object.values(parsedError).join('; ') : parsedError;
          } catch (e) {
            errorMessage = error.message || 'Unknown error occurred';
          }
          this.errorMessage = errorMessage;
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



