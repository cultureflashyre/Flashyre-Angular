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
});
