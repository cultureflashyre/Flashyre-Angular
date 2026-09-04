import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicApplyComponent } from './public-apply.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CollectionFormService } from '../../services/collection-form.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('PublicApplyComponent', () => {
  let component: PublicApplyComponent;
  let fixture: ComponentFixture<PublicApplyComponent>;
  let mockFormService: jasmine.SpyObj<CollectionFormService>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockFormService = jasmine.createSpyObj('CollectionFormService', ['getPublicFormDetails', 'submitPublicForm']);
    
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => 'test-form-uuid'
        }
      }
    };

    mockFormService.getPublicFormDetails.and.returnValue(of({
      unique_id: 'test-form-uuid',
      title: 'Test Position',
      company_name: 'Test Company',
      logo_url: '',
      require_resume: true,
      is_active: true,
      created_by_phone: '9876543210',
      form_token: 'test-token-123'
    }));

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ReactiveFormsModule, PublicApplyComponent],
      providers: [
        FormBuilder,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: CollectionFormService, useValue: mockFormService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(PublicApplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch form details on initialization', () => {
    expect(component.formId).toBe('test-form-uuid');
    expect(mockFormService.getPublicFormDetails).toHaveBeenCalledWith('test-form-uuid');
    expect(component.formDetails).toBeDefined();
    expect(component.formDetails?.title).toBe('Test Position');
    expect(component.formDetails?.created_by_phone).toBe('9876543210');
  });

  it('should generate correct WhatsApp link with prefilled job title', () => {
    expect(component.whatsappLink).toContain('https://wa.me/919876543210?text=Hi%20with%20Test%20Position');
  });

  it('should validate form fields correctly', () => {
    const form = component.applyForm;
    expect(form.valid).toBeFalse();

    form.controls['name'].setValue('Admin User');
    form.controls['email'].setValue('admin@test.com');
    form.controls['phone_number'].setValue('1234567890');
    form.controls['gender'].setValue('Male');

    expect(form.valid).toBeTrue();
  });

  it('should reject invalid names and phone numbers', () => {
    const form = component.applyForm;
    
    form.controls['name'].setValue('Admin123'); // numbers not allowed
    expect(form.controls['name'].hasError('pattern')).toBeTrue();

    form.controls['phone_number'].setValue('12345'); // must be 10 digits
    expect(form.controls['phone_number'].hasError('pattern')).toBeTrue();
  });

  it('should submit successfully when form is valid', () => {
    component.applyForm.controls['name'].setValue('Admin User');
    component.applyForm.controls['email'].setValue('admin@test.com');
    component.applyForm.controls['phone_number'].setValue('1234567890');
    component.applyForm.controls['gender'].setValue('Male');
    component.selectedFile = new File([''], 'resume.pdf');

    mockFormService.submitPublicForm.and.returnValue(of({ message: 'Success' }));
    
    component.onSubmit();
    
    expect(mockFormService.submitPublicForm).toHaveBeenCalled();
    expect(component.submitSuccess).toBeTrue();

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Application Submitted!');
    expect(compiled.textContent).toContain('9876543210');
    expect(compiled.textContent).toContain('Test Position');
  });

  it('should render the company logo in the header with correct asset path', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const logoImg = compiled.querySelector('#flashyre-logo') as HTMLImageElement;
    expect(logoImg).toBeTruthy();
    expect(logoImg.getAttribute('src')).toContain('/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png');
    expect(logoImg.getAttribute('alt')).toBe('Flashyre Logo');
  });
});
