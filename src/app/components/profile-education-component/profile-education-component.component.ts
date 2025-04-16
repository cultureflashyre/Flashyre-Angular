import { Component, Input, ContentChild, ViewChildren, QueryList, ElementRef, TemplateRef, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EducationService } from '../../services/education.service';
import { forkJoin, of, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'profile-education-component',
  templateUrl: './profile-education-component.component.html',
  styleUrls: ['./profile-education-component.component.css'],
})
export class ProfileEducationComponent {
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

  @Input() rootClassName: string = '';
  @Output() formsUpdated = new EventEmitter<FormGroup[]>();

  educationForms: FormGroup[] = [];
  years: number[] = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);
  months: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  universities: string[] = ['Example University', 'Tech Institute', 'Global College'];
  educationLevels: string[] = ["Bachelor's", "Master's", 'PhD', 'Diploma'];
  courses: string[] = ['Computer Science', 'Engineering', 'Business Administration'];
  specializations: string[] = ['AI', 'Machine Learning', 'Data Science'];
  todayDate: string;
  educationFormInstances: any;

  constructor(
    private fb: FormBuilder, 
    private educationService: EducationService,
    private router: Router
  ) {
    this.todayDate = new Date().toISOString().split('T')[0];
    this.addNewForm();
  }

  // Public method to create a form group
  public createEducationForm(data: any = {}): FormGroup {
    return this.fb.group({
      startDate: [data.select_start_date || '', Validators.required],
      endDate: [data.select_end_date || '', Validators.required],
      university: [data.university || '', Validators.required],
      educationLevel: [data.education_level || '', Validators.required],
      course: [data.course || '', Validators.required],
      specialization: [data.specialization || '', Validators.required],
    }, { validators: this.dateRangeValidator });
  }

  private dateRangeValidator(form: FormGroup): { [key: string]: any } | null {
    const startDate = form.get('startDate')?.value;
    const endDate = form.get('endDate')?.value;
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return { dateRangeInvalid: true };
    }
    return null;
  }

  addNewForm() {
    this.educationForms.push(this.createEducationForm());
    this.formsUpdated.emit(this.educationForms);
    setTimeout(() => {
      const lastForm = this.educationFormInstances.last;
      if (lastForm) {
        lastForm.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  }

  removeForm(index: number) {
    this.educationForms.splice(index, 1);
    this.formsUpdated.emit(this.educationForms);
  }

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