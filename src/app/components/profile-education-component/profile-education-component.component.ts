import { Component, Input, ContentChild, ViewChildren, QueryList, ElementRef, TemplateRef, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EducationService } from '../../services/education.service';
import { forkJoin, of, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'profile-education-component', // Standardized selector from the first snippet
  templateUrl: './profile-education-component.component.html',
  styleUrls: ['./profile-education-component.component.css'],
})
export class ProfileEducationComponent {
  /** Content projection references */
  @ContentChild('text3136') text3136: TemplateRef<any>;
  @ContentChild('text313') text313: TemplateRef<any>;
  @ContentChild('text3137') text3137: TemplateRef<any>;
  @ContentChild('text1112') text1112: TemplateRef<any>;
  @ContentChild('text111') text111: TemplateRef<any>;
  @ContentChild('text112') text112: TemplateRef<any>;
  @ContentChild('text3132') text3132: TemplateRef<any>;
  @ContentChild('text3131') text3131: TemplateRef<any>;
  @ContentChild('text314') text314: TemplateRef<any>;
  @ContentChild('text') text: TemplateRef<any>;
  @ContentChild('text1111') text1111: TemplateRef<any>;
  @ContentChild('text2') text2: TemplateRef<any>;
  @ContentChild('text1') text1: TemplateRef<any>;

  /** Input and Output decorators */
  @Input() rootClassName: string = '';
  @Output() formsUpdated = new EventEmitter<FormGroup[]>();

  /** Form and data properties */
  educationForms: FormGroup[] = [];
  years: number[] = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  universities: string[] = ['Example University', 'Tech Institute', 'Global College'];
  educationLevels: string[] = ["Bachelor's", "Master's", 'PhD', 'Diploma'];
  courses: string[] = ['Computer Science', 'Engineering', 'Business Administration'];
  specializations: string[] = ['AI', 'Machine Learning', 'Data Science'];
  todayDate: string;

  /** Reference to form elements for scrolling */
  @ViewChildren('educationFormInstance') educationFormInstances: QueryList<ElementRef>;

  constructor(
    private fb: FormBuilder, 
    private educationService: EducationService,
    private router: Router
  ) {
  
    this.todayDate = new Date().toISOString().split('T')[0];
    this.addNewForm(); // Initialize with one form
  }

  /**
   * Creates a new education form with validation
   */
  private createEducationForm(): FormGroup {
    return this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      university: ['', Validators.required],
      educationLevel: ['', Validators.required],
      course: ['', Validators.required],
      specialization: ['', Validators.required],
    }, { validators: this.dateRangeValidator });
  }

  /**
   * Custom validator to ensure end date is not before start date
   */
  private dateRangeValidator(form: FormGroup): { [key: string]: any } | null {
    const startDate = form.get('startDate')?.value;
    const endDate = form.get('endDate')?.value;

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return { dateRangeInvalid: true };
    }
    return null;
  }

  /**
   * Adds a new form, emits the updated forms, and scrolls to it
   */
  addNewForm() {
    this.educationForms.push(this.createEducationForm());
    this.formsUpdated.emit(this.educationForms);
    setTimeout(() => {
      const lastForm = this.educationFormInstances.last;
      if (lastForm) {
        lastForm.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0); // Delay to ensure DOM updates
  }

  /**
   * Removes a form by index and emits the updated forms
   */
  removeForm(index: number) {
    this.educationForms.splice(index, 1);
    this.formsUpdated.emit(this.educationForms);
  }

  /**
   * Saves all valid forms to the backend
   */
  saveAll(): Observable<any> {
    const validForms = this.educationForms.filter(form => form.valid);
    if (validForms.length === 0) {
      console.log('No valid forms to save');
      return of(null);
    }

    const saveObservables = validForms.map(form => {
      const data = {
        select_start_date: form.value.startDate,
        select_end_date: form.value.endDate,
        university: form.value.university,
        education_level: form.value.educationLevel,
        course: form.value.course,
        specialization: form.value.specialization,
      };
      return this.educationService.addEducation(data);
    });

    return forkJoin(saveObservables).pipe(
      tap(() => this.formsUpdated.emit(this.educationForms))
    );
  }

  saveAndNext() {
      this.saveAll().subscribe({
        next: () => {
          console.log('All educations saved successfully');
          this.router.navigate(['/profile-certification-page']);
        },
        error: (error) => {
          console.error('Error saving educations:', error);
          // Optionally, display an error message to the user (e.g., using a toast service)
        }
      });
  }

  goToPrevious() {
    this.router.navigate(['/profile-employment-page']);
  }

  skipToNextSection() {
    console.log('Skipping to next section');
    this.router.navigate(['/profile-certification-page']);
  }
}