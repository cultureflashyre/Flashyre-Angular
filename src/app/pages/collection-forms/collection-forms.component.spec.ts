import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CollectionFormsComponent } from './collection-forms.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CollectionFormService } from '../../services/collection-form.service';
import { AdbRequirementService } from '../../services/adb-requirement.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('CollectionFormsComponent', () => {
  let component: CollectionFormsComponent;
  let fixture: ComponentFixture<CollectionFormsComponent>;
  let mockFormService: jasmine.SpyObj<CollectionFormService>;
  let mockAdbService: jasmine.SpyObj<AdbRequirementService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockFormService = jasmine.createSpyObj('CollectionFormService', ['getForms', 'createForm', 'updateForm', 'deleteForm']);
    mockAdbService = jasmine.createSpyObj('AdbRequirementService', ['getRequirements']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockFormService.getForms.and.returnValue(of([]));
    mockAdbService.getRequirements.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ReactiveFormsModule, CollectionFormsComponent],
      providers: [
        FormBuilder,
        { provide: CollectionFormService, useValue: mockFormService },
        { provide: AdbRequirementService, useValue: mockAdbService },
        { provide: Router, useValue: mockRouter }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionFormsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load forms and job requirements on init', () => {
    expect(mockFormService.getForms).toHaveBeenCalled();
    expect(mockAdbService.getRequirements).toHaveBeenCalled();
  });

  it('should initialize creation form group correctly', () => {
    component.initForm();
    expect(component.createFormGroup).toBeDefined();
    expect(component.createFormGroup.controls['title']).toBeDefined();
    expect(component.createFormGroup.controls['require_resume'].value).toBeTrue();
  });

  it('should navigate to candidate workflow page when viewCandidates is called', () => {
    const mockForm = { unique_id: 'test-uuid', title: 'Test Form', require_resume: true, is_active: true };
    component.viewCandidates(mockForm);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/recruiter-workflow-candidate'], {
      queryParams: { form_id: 'test-uuid' }
    });
  });

  it('should toggle active status of a form', () => {
    const mockForm = { unique_id: 'test-uuid', title: 'Test Form', require_resume: true, is_active: true };
    mockFormService.updateForm.and.returnValue(of({ ...mockForm, is_active: false }));
    component.toggleActive(mockForm);
    expect(mockFormService.updateForm).toHaveBeenCalledWith('test-uuid', { is_active: false });
  });

  describe('Form Title Validation & Patterns', () => {
    it('should accept valid job titles like AI/ML and Data Analyst - 2', () => {
      const titleControl = component.createFormGroup.controls['title'];
      const validTitles = [
        'AI/ML',
        'AI/ML Engineer',
        'Data Analyst - 2',
        'Data Analyst – 2', // en-dash
        'Data Analyst — Lead', // em-dash
        'C++ Developer',
        'C# Backend Engineer',
        'Senior Dev, Full-Stack (Remote)',
        'DevOps / SRE Lead',
        'Product Manager #1'
      ];

      validTitles.forEach(title => {
        titleControl.setValue(title);
        expect(titleControl.valid).toBeTrue();
        expect(titleControl.errors).toBeNull();
      });
    });

    it('should reject whitespace-only or empty titles', () => {
      const titleControl = component.createFormGroup.controls['title'];
      
      titleControl.setValue('');
      expect(titleControl.valid).toBeFalse();
      expect(titleControl.errors?.['required']).toBeTruthy();

      titleControl.setValue('   ');
      expect(titleControl.valid).toBeFalse();
      expect(titleControl.errors?.['pattern']).toBeTruthy();
    });

    it('should reject XSS payloads in title like <script>', () => {
      const titleControl = component.createFormGroup.controls['title'];
      titleControl.setValue('<script>alert(1)</script>');
      expect(titleControl.valid).toBeFalse();
      expect(titleControl.errors?.['pattern']).toBeTruthy();
    });

    it('should reject titles exceeding 100 characters', () => {
      const titleControl = component.createFormGroup.controls['title'];
      titleControl.setValue('A'.repeat(101));
      expect(titleControl.valid).toBeFalse();
      expect(titleControl.errors?.['maxlength']).toBeTruthy();
    });
  });

  describe('Validation Helpers & Error Messages', () => {
    it('should correctly determine isFieldInvalid based on touched/dirty/attemptedSubmit', () => {
      const titleControl = component.createFormGroup.controls['title'];
      titleControl.setValue('');
      expect(component.isFieldInvalid('title')).toBeFalse();

      titleControl.markAsTouched();
      expect(component.isFieldInvalid('title')).toBeTrue();

      titleControl.setValue('Valid Title');
      expect(component.isFieldInvalid('title')).toBeFalse();

      // Reset and test hasAttemptedSubmit
      component.createFormGroup.reset();
      component.hasAttemptedSubmit = true;
      expect(component.isFieldInvalid('title')).toBeTrue();
    });

    it('should return appropriate error messages via getFieldError', () => {
      const titleControl = component.createFormGroup.controls['title'];
      titleControl.setValue('');
      expect(component.getFieldError('title')).toBe('Form title is required.');

      titleControl.setValue('<script>');
      expect(component.getFieldError('title')).toBe('Form title contains invalid characters.');

      titleControl.setValue('A'.repeat(101));
      expect(component.getFieldError('title')).toBe('Form title cannot exceed 100 characters.');

      const logoControl = component.createFormGroup.controls['logo_url'];
      logoControl.setValue('not-a-url');
      expect(component.getFieldError('logo_url')).toBe('Please enter a valid URL starting with http:// or https://');

      const maxControl = component.createFormGroup.controls['max_submissions'];
      maxControl.setValue('0');
      expect(component.getFieldError('max_submissions')).toBe('Maximum submissions must be at least 1.');

      const expireControl = component.createFormGroup.controls['expires_at'];
      expireControl.setValue('2020-01-01T00:00');
      expect(component.getFieldError('expires_at')).toBe('Expiration date must be set to a future date and time.');
    });

    it('should mark all fields as touched and set hasAttemptedSubmit on invalid onSubmit', () => {
      component.createFormGroup.controls['title'].setValue('');
      expect(component.hasAttemptedSubmit).toBeFalse();

      component.onSubmit();

      expect(component.hasAttemptedSubmit).toBeTrue();
      expect(component.createFormGroup.controls['title'].touched).toBeTrue();
      expect(mockFormService.createForm).not.toHaveBeenCalled();
    });
  });
});
