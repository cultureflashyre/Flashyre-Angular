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

  private createEducationForm(): FormGroup {
    return this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      university: ['', Validators.required],
      educationLevel: ['', Validators.required],
      course: ['', Validators.required],
      specialization: ['', Validators.required]
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
      resolve(true);
      return;
    }

    const saveObservables = validForms.map(form => {
      console.log('Raw form values:', form.value);
      
      // Get the names corresponding to the selected IDs
      const university = this.universities.find(u => u.id === form.value.university)?.name || '';
      const educationLevel = this.educationLevels.find(e => e.id === form.value.educationLevel)?.name || '';
      const course = this.courses.find(c => c.id === form.value.course)?.name || '';
      const specialization = this.specializations.find(s => s.id === form.value.specialization)?.name || '';

      const data = {
        select_start_date: form.value.startDate,
        select_end_date: form.value.endDate,
        university: university,  // Send name as string
        education_level: educationLevel,
        course: course,
        specialization: specialization
      };

      // Validate that all fields are non-empty strings
      if (!data.university || !data.education_level || !data.course || !data.specialization) {
        console.error('Invalid text values:', data);
        this.errorMessage = 'Please select valid options for all dropdowns';
        return [];
      }

      console.log('Sending data to backend:', data);
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