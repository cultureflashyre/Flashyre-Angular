import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { IntakeDrawerComponent } from './intake-drawer.component';
import { LocationAutocompleteService } from '../../services/location-autocomplete.service';
import { environment } from '../../../environments/environment';

function person(detail: any[]): any {
  return {
    id: 5, uuid: 'u', kind: 'intake', status: 'open', promoted_candidate: null, first_name: 'Asha', last_name: 'Rao',
    email: 'asha@example.com', phone_number: '9876543210', skills: 'Communication', missing_fields: [],
    verification_status: 'ai_unverified', ai_filled_fields: ['skills'], source: 'Form Submission', sourced_by: 'REC1',
    sourced_by_name: 'Recruiter One', skills_list: ['Communication'], skills_detail: detail, preferred_locations: [],
    education: [], submissions: [], created_at: '', updated_at: '',
  };
}

const STATED = { name: 'Communication', status: 'stated', source: 'resume', section: 'skills', evidence: 'Skills: Communication', active: true };
const SUGGESTED = { name: 'Sales', status: 'suggested', source: 'resume', section: 'title', evidence: 'Sales Executive', active: false };

describe('IntakeDrawerComponent skills review', () => {
  let fixture: ComponentFixture<IntakeDrawerComponent>;
  let component: IntakeDrawerComponent;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}api/candidate-intake/5/`;
  const places = { ready: () => Promise.resolve(false), predictions: () => of([] as any[]), resolve: (p: any) => of({ name: p.description, lat: null, lng: null }) };

  function open(p: any, canEdit = true) {
    fixture.componentRef.setInput('person', p);
    fixture.componentRef.setInput('canEdit', canEdit);
    fixture.componentRef.setInput('canVerify', canEdit);
    fixture.detectChanges();
    http.match(r => r.url.includes('api/candidate-notes')).forEach(r => r.flush([]));
    fixture.detectChanges();
  }
  const el = () => fixture.nativeElement as HTMLElement;
  const q = (sel: string) => el().querySelector(sel) as HTMLElement | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IntakeDrawerComponent, HttpClientTestingModule],
      providers: [{ provide: LocationAutocompleteService, useValue: places }],
    });
    fixture = TestBed.createComponent(IntakeDrawerComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows no review block and an enabled Verify when nothing is suggested', () => {
    open(person([STATED]));
    expect(q('[data-test="skills-review"]')).toBeNull();
    expect((q('[data-test="verify-btn"]') as HTMLButtonElement).disabled).toBeFalse();
  });

  it('lists suggested skills apart and disables Verify until they are reviewed', () => {
    open(person([STATED, SUGGESTED]));
    const chips = el().querySelectorAll('[data-test="suggested-skill"]');
    expect(chips.length).toBe(1);
    expect(chips[0].textContent).toContain('Sales');
    expect(chips[0].getAttribute('title')).toBe('Sales Executive');
    expect((q('[data-test="verify-btn"]') as HTMLButtonElement).disabled).toBeTrue();
  });

  it('Confirm all posts to the confirm endpoint and clears the block', () => {
    open(person([STATED, SUGGESTED]));
    (q('[data-test="confirm-all-skills"]') as HTMLButtonElement).click();
    const req = http.expectOne(`${base}skills/confirm/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(person([{ ...STATED, status: 'confirmed' }, { ...SUGGESTED, status: 'confirmed' }]));
    fixture.detectChanges();
    expect(q('[data-test="skills-review"]')).toBeNull();
    expect((q('[data-test="verify-btn"]') as HTMLButtonElement).disabled).toBeFalse();
  });

  it('Confirm on one chip sends only that name', () => {
    open(person([STATED, SUGGESTED]));
    (q('[data-test="suggested-skill"] button.ok') as HTMLButtonElement).click();
    const req = http.expectOne(`${base}skills/confirm/`);
    expect(req.request.body).toEqual({ names: ['Sales'] });
    req.flush(person([STATED]));
  });

  it('Remove on one chip posts to the remove endpoint', () => {
    open(person([STATED, SUGGESTED]));
    const buttons = el().querySelectorAll('[data-test="suggested-skill"] button');
    (buttons[buttons.length - 1] as HTMLButtonElement).click();
    const req = http.expectOne(`${base}skills/remove/`);
    expect(req.request.body).toEqual({ names: ['Sales'] });
    req.flush(person([STATED]));
  });

  it('people who cannot edit see the suggestions without buttons', () => {
    open(person([STATED, SUGGESTED]), false);
    expect(q('[data-test="suggested-skill"]')).not.toBeNull();
    expect(q('[data-test="confirm-all-skills"]')).toBeNull();
    expect(q('[data-test="suggested-skill"] button')).toBeNull();
  });
});
