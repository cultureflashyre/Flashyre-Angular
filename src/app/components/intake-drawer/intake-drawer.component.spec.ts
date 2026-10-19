import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IntakeDrawerComponent } from './intake-drawer.component';
import { IntakePerson } from '../../services/recruiter-workflow-candidate.service';
import { environment } from '../../../environments/environment';

function person(overrides: Partial<IntakePerson> = {}): IntakePerson {
  return {
    id: 5, uuid: 'u', kind: 'intake', status: 'open', promoted_candidate: null,
    first_name: 'Asha', last_name: null, email: 'asha@example.com', phone_number: '9876543210',
    skills: null, missing_fields: ['last_name', 'skills', 'education', 'preferred_location'],
    verification_status: 'verified', ai_filled_fields: [], source: 'Form Submission',
    sourced_by: 'REC1', sourced_by_name: 'Recruiter One', skills_list: [], preferred_locations: [],
    education: [], submissions: [], created_at: '', updated_at: '',
    ...overrides,
  } as IntakePerson;
}

describe('IntakeDrawerComponent', () => {
  let fixture: ComponentFixture<IntakeDrawerComponent>;
  let component: IntakeDrawerComponent;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}api/candidate-intake/5/`;

  function open(p: IntakePerson, canEdit = true) {
    fixture.componentRef.setInput('person', p);
    fixture.componentRef.setInput('canEdit', canEdit);
    fixture.componentRef.setInput('canVerify', canEdit);
    fixture.detectChanges();
    // the notes panel inside the drawer loads its list; answer it so only the drawer's own requests remain
    http.match(r => r.url.includes('api/candidate-notes')).forEach(r => r.flush([]));
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [IntakeDrawerComponent, HttpClientTestingModule] });
    fixture = TestBed.createComponent(IntakeDrawerComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists what is still missing in plain words', () => {
    open(person());
    const text = (fixture.nativeElement as HTMLElement).textContent!;
    expect(text).toContain('Still needed for a complete profile');
    expect(text).toContain('Last name, Skills, Education, Preferred location');
  });

  it('highlights only the missing fields', () => {
    open(person());
    expect(component.isMissing('skills')).toBeTrue();
    expect(component.isMissing('email')).toBeFalse();
  });

  it('builds the payload without empty values, with skills and locations as lists', () => {
    open(person());
    component.form.last_name = ' Rao ';
    component.form.latest_education_level = 'B.Tech';
    component.form.latest_university = '';
    component.skillInput = 'Python';
    component.addSkill();
    component.locationInput = 'Pune';
    component.addLocation();
    component.skillInput = 'python';          // same skill again, different case: ignored
    component.addSkill();
    const payload = component.buildPayload();
    expect(payload.last_name).toBe('Rao');
    expect(payload.latest_education_level).toBe('B.Tech');
    expect(payload.skills).toBe('Python');
    expect(payload.preferred_location).toEqual(['Pune']);
    expect('latest_university' in payload).toBeFalse();
    expect(payload.first_name).toBe('Asha');
  });

  it('saves with PATCH and reports a promotion', () => {
    open(person());
    let emitted: any = null;
    component.updated.subscribe(e => emitted = e);
    component.skillInput = 'Go';
    component.addSkill();
    component.save();
    const req = http.expectOne(url);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.skills).toBe('Go');
    req.flush({ kind: 'candidate', id: 77, missing_fields: [], promoted: true });
    expect(emitted).toEqual({ result: jasmine.objectContaining({ promoted: true }), promoted: true });
    expect(component.busy).toBeFalse();
  });

  it('shows the server message when saving fails', () => {
    open(person());
    component.save();
    http.expectOne(url).flush({ email: ['This email already belongs to another person.'] }, { status: 400, statusText: 'Bad Request' });
    expect(component.error).toBe('email: This email already belongs to another person.');
  });

  it('does not let a user who cannot edit save or verify', () => {
    open(person({ verification_status: 'ai_unverified' }), false);
    component.save();
    component.verify();
    http.expectNone(url);
    http.expectNone(`${url}verify/`);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Only the recruiter who sourced this person');
  });

  it('verifies with POST and keeps the panel open', () => {
    open(person({ verification_status: 'ai_unverified' }));
    component.verify();
    const req = http.expectOne(`${url}verify/`);
    expect(req.request.method).toBe('POST');
    req.flush(person({ verification_status: 'verified' }));
    expect(component.person!.verification_status).toBe('verified');
  });

  it('names the person, falling back to email or phone', () => {
    open(person());
    expect(component.displayName).toBe('Asha');
    open(person({ first_name: null, last_name: null }));
    expect(component.displayName).toBe('asha@example.com');
  });
});
