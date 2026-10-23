import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecruiterWorkflowCandidateService } from './recruiter-workflow-candidate.service';
import { environment } from '../../environments/environment';

describe('RecruiterWorkflowCandidateService (Needs info inbox)', () => {
  let service: RecruiterWorkflowCandidateService;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(RecruiterWorkflowCandidateService);
    http = TestBed.inject(HttpTestingController);
    localStorage.setItem('user_id', 'REC1');
  });

  afterEach(() => http.verify());

  it('lists the inbox with the chosen filters', () => {
    service.getIntakeList({ page: 2, status: 'open', missing: 'skills', q: 'asha rao', formId: 'abc', unverified: true }).subscribe();
    const req = http.expectOne(r => r.url.startsWith(`${api}api/candidate-intake/?`));
    expect(req.request.method).toBe('GET');
    expect(req.request.url).toContain('page=2');
    expect(req.request.url).toContain('status=open');
    expect(req.request.url).toContain('missing=skills');
    expect(req.request.url).toContain('q=asha%20rao');
    expect(req.request.url).toContain('form_id=abc');
    expect(req.request.url).toContain('unverified=1');
    req.flush({ results: [], count: 0 });
  });

  it('leaves out filters that are not set', () => {
    service.getIntakeList().subscribe();
    const req = http.expectOne(`${api}api/candidate-intake/?page=1`);
    req.flush({ results: [], count: 0 });
  });

  it('reads the summary, one person and saves changes with PATCH', () => {
    service.getIntakeSummary().subscribe();
    http.expectOne(`${api}api/candidate-intake/summary/`).flush({ open: 3 });

    service.getIntake(5).subscribe();
    http.expectOne(`${api}api/candidate-intake/5/`).flush({});

    service.updateIntake(5, { skills: 'Go' }).subscribe();
    const patch = http.expectOne(`${api}api/candidate-intake/5/`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ skills: 'Go' });
    patch.flush({ kind: 'intake', id: 5, missing_fields: [] });
  });

  it('sends multipart with the resume when a file is given, lists as JSON text', () => {
    const file = new File(['%PDF-1.4'], 'cv.pdf', { type: 'application/pdf' });
    service.updateIntake(5, { skills: 'Go', preferred_location: [{ name: 'Hubli', lat: 1, lng: 2 }], ai_filled_fields: ['skills'] }, file).subscribe();
    const req = http.expectOne(`${api}api/candidate-intake/5/`);
    expect(req.request.method).toBe('PATCH');
    const body = req.request.body as FormData;
    expect(body instanceof FormData).toBeTrue();
    expect((body.get('resume') as File).name).toBe('cv.pdf');
    expect(body.get('skills')).toBe('Go');
    expect(JSON.parse(body.get('preferred_location') as string)).toEqual([{ name: 'Hubli', lat: 1, lng: 2 }]);
    expect(JSON.parse(body.get('ai_filled_fields') as string)).toEqual(['skills']);
    req.flush({});
  });

  it('keeps plain JSON when there is no file', () => {
    service.updateIntake(5, { skills: 'Go' }, null).subscribe();
    const req = http.expectOne(`${api}api/candidate-intake/5/`);
    expect(req.request.body).toEqual({ skills: 'Go' });
    req.flush({});
  });

  it('verifies candidates and inbox people', () => {
    service.verifyCandidate(7).subscribe();
    const a = http.expectOne(`${api}api/candidates/7/verify/`);
    expect(a.request.method).toBe('POST');
    a.flush({});

    service.verifyIntake(8).subscribe();
    const b = http.expectOne(`${api}api/candidate-intake/8/verify/`);
    expect(b.request.method).toBe('POST');
    b.flush({});
  });

  it('asks for the resume to be read again, for inbox people and candidates', () => {
    service.reparseIntakeResume(8).subscribe(p => expect(p.resume_status).toBe('processing'));
    const a = http.expectOne(`${api}api/candidate-intake/8/reparse-resume/`);
    expect(a.request.method).toBe('POST');
    a.flush({ id: 8, resume_status: 'processing', resume_status_detail: 'Reading the resume' });

    service.reparseCandidateResume(7).subscribe(c => expect(c.resume_status).toBe('processing'));
    const b = http.expectOne(`${api}api/candidates/7/reparse-resume/`);
    expect(b.request.method).toBe('POST');
    b.flush({ id: 7, resume_status: 'processing', resume_status_detail: null });
  });

  it('adds inbox people to a job pipeline by intake_ids', () => {
    service.addIntakeToJob(12, [1, 2]).subscribe();
    const req = http.expectOne(`${api}api/ats/bulk-add/`);
    expect(req.request.body).toEqual({ job_id: 12, intake_ids: [1, 2] });
    req.flush({ added: 2 });
  });

  it('rates an inbox person with intake_id and reads their rating history', () => {
    service.submitRating({ intake_id: 4, rating_category: 'Technical-IT', scores: [{ criterion_key: 'coding_knowledge', score: 3 }] }).subscribe();
    const post = http.expectOne(`${api}api/candidate-ratings/`);
    expect(post.request.body.intake_id).toBe(4);
    expect(post.request.body.candidate_id).toBeUndefined();
    post.flush({});

    service.getIntakeRatings(4).subscribe();
    http.expectOne(`${api}api/candidate-ratings/?intake_id=4`).flush([]);
  });

  it('reads one candidate and updates it with a partial multipart PATCH (the sidebar)', () => {
    service.getCandidate(7).subscribe();
    const get = http.expectOne(`${api}api/candidates/7/`);
    expect(get.request.method).toBe('GET');
    get.flush({ id: 7 });

    const form = new FormData();
    form.append('skills', 'Go');
    service.patchCandidate(7, form).subscribe();
    const patch = http.expectOne(`${api}api/candidates/7/`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toBe(form);
    patch.flush({ id: 7 });
  });

  it('reads, adds and deletes notes for either kind of person', () => {
    service.getNotes('intake', 3).subscribe();
    http.expectOne(`${api}api/candidate-notes/?intake_id=3`).flush([]);

    service.getNotes('candidate', 9).subscribe();
    http.expectOne(`${api}api/candidate-notes/?candidate_id=9`).flush([]);

    service.addNote('candidate', 9, 'called back').subscribe();
    const add = http.expectOne(`${api}api/candidate-notes/`);
    expect(add.request.body).toEqual({ candidate_id: 9, body: 'called back' });
    add.flush({});

    service.deleteNote(11).subscribe();
    const del = http.expectOne(`${api}api/candidate-notes/11/`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
  });
});
