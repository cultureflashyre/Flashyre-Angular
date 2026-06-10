import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CollectionFormService, CollectionForm, PublicFormDetails } from './collection-form.service';
import { environment } from '../../environments/environment';

describe('CollectionFormService', () => {
  let service: CollectionFormService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CollectionFormService]
    });
    service = TestBed.inject(CollectionFormService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve collection forms (GET)', () => {
    const mockForms: CollectionForm[] = [
      { title: 'Form 1', require_resume: true, is_active: true },
      { title: 'Form 2', require_resume: false, is_active: false }
    ];

    service.getForms().subscribe(forms => {
      expect(forms.length).toBe(2);
      expect(forms).toEqual(mockForms);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}api/collection-forms/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockForms);
  });

  it('should create a collection form (POST)', () => {
    const newForm: CollectionForm = { title: 'New Form', require_resume: true, is_active: true };

    service.createForm(newForm).subscribe(form => {
      expect(form.title).toBe('New Form');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}api/collection-forms/`);
    expect(req.request.method).toBe('POST');
    req.flush(newForm);
  });

  it('should update a collection form (PUT)', () => {
    const formUpdate: Partial<CollectionForm> = { is_active: false };
    const mockResponse: CollectionForm = { title: 'Updated Title', require_resume: true, is_active: false };

    service.updateForm('some-uuid', formUpdate).subscribe(form => {
      expect(form.is_active).toBeFalse();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}api/collection-forms/some-uuid/`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should delete a collection form (DELETE)', () => {
    service.deleteForm('some-uuid').subscribe(res => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}api/collection-forms/some-uuid/`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
