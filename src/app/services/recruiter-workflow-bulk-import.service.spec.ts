import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RecruiterWorkflowBulkImportService } from './recruiter-workflow-bulk-import.service';
import { environment } from 'src/environments/environment';

describe('RecruiterWorkflowBulkImportService preview API', () => {
  let service: RecruiterWorkflowBulkImportService;
  let http: HttpTestingController;
  const base = environment.apiUrl + 'api/bulk-import/';

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(RecruiterWorkflowBulkImportService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('createPreview posts file, mapping JSON and sourcer id as multipart', () => {
    const file = new File(['a'], 'sheet.xlsx');
    service.createPreview(file, { '0': 'first_name' }, '7').subscribe();
    const req = http.expectOne(base + 'previews/');
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect((body.get('file') as File).name).toBe('sheet.xlsx');
    expect(body.get('mapping')).toBe('{"0":"first_name"}');
    expect(body.get('sourcer_id')).toBe('7');
    req.flush({ id: 'p1' });
  });

  it('createPreview omits sourcer_id when none is given', () => {
    service.createPreview(new File(['a'], 's.csv'), {}).subscribe();
    const req = http.expectOne(base + 'previews/');
    expect((req.request.body as FormData).has('sourcer_id')).toBeFalse();
    req.flush({});
  });

  it('previewHeaders sends only the file by default', () => {
    service.previewHeaders(new File(['a'], 's.csv')).subscribe();
    const req = http.expectOne(base + 'preview-headers/');
    const body = req.request.body as FormData;
    expect(body.has('sheet')).toBeFalse();
    expect(body.has('header_row')).toBeFalse();
    req.flush({});
  });

  it('previewHeaders sends the chosen sheet and header row', () => {
    service.previewHeaders(new File(['a'], 's.xlsx'), { sheet: 'Candidates', headerRow: 8 }).subscribe();
    const req = http.expectOne(base + 'preview-headers/');
    const body = req.request.body as FormData;
    expect(body.get('sheet')).toBe('Candidates');
    expect(body.get('header_row')).toBe('8');
    req.flush({});
  });

  it('createPreview repeats the sheet and header row so it reads the same table', () => {
    service.createPreview(new File(['a'], 's.xlsx'), { '0': 'email' }, undefined, { sheet: 'Data', headerRow: 3 }).subscribe();
    const req = http.expectOne(base + 'previews/');
    const body = req.request.body as FormData;
    expect(body.get('sheet')).toBe('Data');
    expect(body.get('header_row')).toBe('3');
    expect(body.has('sourcer_id')).toBeFalse();
    req.flush({});
  });

  it('getPreviewRows sends page and filter', () => {
    service.getPreviewRows('p1', 2, 'needs_info').subscribe();
    const req = http.expectOne(r => r.url === base + 'previews/p1/rows/');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('filter')).toBe('needs_info');
    req.flush({ results: [], count: 0 });
  });

  it('updatePreviewRow patches edits and accepted fixes', () => {
    service.updatePreviewRow('p1', 12, { phone: '9876543210' }, { email: 'a@gmail.com' }).subscribe();
    const req = http.expectOne(base + 'previews/p1/rows/12/');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ edits: { phone: '9876543210' }, accepted_fixes: { email: 'a@gmail.com' } });
    req.flush({});
  });

  it('updatePreviewRow sends only what was given (empty email withdraws a fix)', () => {
    service.updatePreviewRow('p1', 3, undefined, { email: '' }).subscribe();
    const req = http.expectOne(base + 'previews/p1/rows/3/');
    expect(req.request.body).toEqual({ accepted_fixes: { email: '' } });
    req.flush({});
  });

  it('acceptFixes posts the confidences', () => {
    service.acceptFixes('p1', ['auto', 'likely']).subscribe();
    const req = http.expectOne(base + 'previews/p1/accept-fixes/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ confidence: ['auto', 'likely'] });
    req.flush({ updated: 2 });
  });

  it('executePreview posts to execute', () => {
    let jobId = '';
    service.executePreview('p1').subscribe(r => (jobId = r.job_id));
    const req = http.expectOne(base + 'previews/p1/execute/');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, job_id: 'j1', message: 'ok' });
    expect(jobId).toBe('j1');
  });

  it('downloadProblems fetches preview and job CSVs as blobs', () => {
    service.downloadProblems('p1').subscribe();
    const a = http.expectOne(base + 'previews/p1/problems.csv');
    expect(a.request.method).toBe('GET');
    expect(a.request.responseType).toBe('blob');
    a.flush(new Blob(['x']));

    service.downloadProblems('j9', 'job').subscribe();
    const b = http.expectOne(base + 'jobs/j9/problems.csv');
    expect(b.request.responseType).toBe('blob');
    b.flush(new Blob(['x']));
  });

  it('downloadTemplate fetches the xlsx as a blob', () => {
    service.downloadTemplate().subscribe();
    const req = http.expectOne(base + 'template.xlsx');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['x']));
  });
});
