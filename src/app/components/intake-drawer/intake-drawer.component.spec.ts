import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { IntakeDrawerComponent } from './intake-drawer.component';
import { IntakePerson } from '../../services/recruiter-workflow-candidate.service';
import { LocationAutocompleteService } from '../../services/location-autocomplete.service';
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

/** A candidate row as the people list sends it (CandidateSerializer): skills as text, locations as a list, a signed link. */
function candidateRow(overrides: any = {}): any {
  return {
    id: 5, kind: 'candidate', first_name: 'Rahul', last_name: 'Sharma', email: 'rahul@example.com',
    phone_number: '9333000111', skills: 'Python, SQL', latest_education_level: '', work_experience: 'Engineer',
    preferred_location: [{ name: 'Pune', lat: 18.5, lng: 73.8 }], current_location: 'Hubli, Karnataka',
    missing_fields: ['education'], verification_status: 'verified', ai_filled_fields: [], source: 'External',
    sourced_by_id: 'REC1', sourced_by_name: 'Recruiter One', resume: 'https://storage.example/rahul.pdf?sig=1',
    resume_filename: 'rahul.pdf',
    ...overrides,
  };
}

function pdf(name = 'cv.pdf', size?: number): File {
  const file = new File(['%PDF-1.4 resume'], name, { type: 'application/pdf' });
  if (size !== undefined) { Object.defineProperty(file, 'size', { value: size }); }
  return file;
}

describe('IntakeDrawerComponent', () => {
  let fixture: ComponentFixture<IntakeDrawerComponent>;
  let component: IntakeDrawerComponent;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}api/candidate-intake/5/`;
  const parseUrl = `${environment.apiUrl}api/parse-resume/`;

  // Places stand-in: Maps "unavailable" unless a test changes it, so typed text is added as typed
  const places = {
    ready: () => Promise.resolve(false),
    predictions: (_term: string) => of([] as any[]),
    resolve: (p: any) => of({ name: p.description, lat: null, lng: null }),
  };

  function open(p: IntakePerson, canEdit = true) {
    fixture.componentRef.setInput('person', p);
    fixture.componentRef.setInput('canEdit', canEdit);
    fixture.componentRef.setInput('canVerify', canEdit);
    fixture.detectChanges();
    // the notes panel inside the drawer loads its list; answer it so only the drawer's own requests remain
    http.match(r => r.url.includes('api/candidate-notes')).forEach(r => r.flush([]));
    fixture.detectChanges();
  }

  const text = () => (fixture.nativeElement as HTMLElement).textContent!;

  /** Chooses a file, answers the parse call with a queued job and returns after the first status request is due. */
  function startParse(file: File = pdf()) {
    component.chooseResume(file);
    http.expectOne(parseUrl).flush({ status: 'PROCESSING', staging_id: 9 });
    tick(0);
  }
  function answerStatus(body: any) {
    http.expectOne(r => r.url.includes('api/resume-status/9/')).flush(body);
  }

  beforeEach(() => {
    places.ready = () => Promise.resolve(false);
    places.predictions = () => of([]);
    TestBed.configureTestingModule({
      imports: [IntakeDrawerComponent, HttpClientTestingModule],
      providers: [{ provide: LocationAutocompleteService, useValue: places }],
    });
    fixture = TestBed.createComponent(IntakeDrawerComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists what is still missing in plain words', () => {
    open(person());
    expect(text()).toContain('Still needed for a complete profile');
    expect(text()).toContain('Last name, Skills, Education, Preferred location');
  });

  it('highlights only the missing fields', () => {
    open(person());
    expect(component.isMissing('skills')).toBeTrue();
    expect(component.isMissing('email')).toBeFalse();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.loc-preferred')!.parentElement!.classList).toContain('need');
    expect(host.querySelector('.loc-current')!.parentElement!.classList).not.toContain('need');
  });

  describe('locations', () => {
    it('fills the chips from the existing preferred and current locations', () => {
      open(person({
        preferred_locations: [{ name: 'Hubli, Karnataka', lat: 15.36, lng: 75.12 }, { name: 'Pune', lat: null, lng: null }],
        current_location: 'Bengaluru',
      } as any));
      expect(component.locations).toEqual([
        { name: 'Hubli, Karnataka', lat: 15.36, lng: 75.12 }, { name: 'Pune', lat: null, lng: null }]);
      const chips = (sel: string) => Array.from(fixture.nativeElement.querySelectorAll(`${sel} .chip`))
        .map((c: any) => c.firstChild.textContent.trim());
      expect(chips('.loc-preferred')).toEqual(['Hubli, Karnataka', 'Pune']);
      expect(chips('.loc-current')).toEqual(['Bengaluru']);
    });

    it('sends picked places with lat/lng, typed ones as plain names, and the current location as a name', () => {
      open(person());
      component.locations = [{ name: 'Hubli, Karnataka', lat: 15.36, lng: 75.12 }, { name: 'Typed Town', lat: null, lng: null }];
      component.currentLocation = [{ name: 'Pune, Maharashtra', lat: 18.5, lng: 73.8 }];
      const payload = component.buildPayload();
      expect(payload.preferred_location).toEqual([
        { name: 'Hubli, Karnataka', lat: 15.36, lng: 75.12 }, { name: 'Typed Town', lat: null, lng: null }]);
      expect(payload.current_location).toBe('Pune, Maharashtra');
    });

    it('leaves the location keys out when there are none', () => {
      open(person());
      const payload = component.buildPayload();
      expect('preferred_location' in payload).toBeFalse();
      expect('current_location' in payload).toBeFalse();
    });

    it('shows the places as plain chips, with no inputs, for a person who cannot be edited', () => {
      open(person({ preferred_locations: [{ name: 'Pune', lat: null, lng: null }], current_location: 'Delhi' } as any), false);
      const host = fixture.nativeElement as HTMLElement;
      expect(Array.from(host.querySelectorAll('.view .chip')).map(c => c.textContent!.trim())).toEqual(['Pune', 'Delhi']);
      expect(host.querySelector('input')).toBeNull();
      expect(host.querySelector('app-location-input')).toBeNull();
    });

    it('Save waits for a place typed just before pressing it (the blur lookup is asynchronous)', fakeAsync(() => {
      let releaseReady!: () => void;
      places.ready = () => new Promise<boolean>(resolve => { releaseReady = () => resolve(true); });
      places.predictions = () => of([{ description: 'Hubli, Karnataka', place_id: 'p1' }] as any[]);
      places.resolve = () => of({ name: 'Hubli, Karnataka', lat: 15.36, lng: 75.12 }) as any;
      open(person());

      const box: HTMLInputElement = fixture.nativeElement.querySelector('.loc-preferred input');
      box.value = 'Hubli';
      box.dispatchEvent(new Event('input'));
      box.dispatchEvent(new Event('blur'));          // clicking Save blurs the box first
      component.save();
      flushMicrotasks();
      http.expectNone(url);                          // still waiting for the lookup
      expect(component.busy).toBeTrue();

      releaseReady();
      flushMicrotasks();
      const req = http.expectOne(url);
      expect(req.request.body.preferred_location).toEqual([{ name: 'Hubli, Karnataka', lat: 15.36, lng: 75.12 }]);
      req.flush({ kind: 'intake', id: 5, missing_fields: [] });
      discardPeriodicTasks();
      flush();
    }));

    it('Save also takes text typed in a box that was never blurred', fakeAsync(() => {
      open(person());
      const box: HTMLInputElement = fixture.nativeElement.querySelector('.loc-current input');
      box.value = 'Delhi';
      box.dispatchEvent(new Event('input'));
      component.save();
      flushMicrotasks();
      expect(http.expectOne(url).request.body.current_location).toBe('Delhi');
      discardPeriodicTasks();
      flush();
    }));
  });

  it('builds the payload without empty values, with skills as text and locations as a list', () => {
    open(person());
    component.form.last_name = ' Rao ';
    component.form.latest_education_level = 'B.Tech';
    component.form.latest_university = '';
    component.skillInput = 'Python';
    component.addSkill();
    component.locations = [{ name: 'Pune', lat: null, lng: null }];
    component.skillInput = 'python';          // same skill again, different case: ignored
    component.addSkill();
    const payload = component.buildPayload();
    expect(payload.last_name).toBe('Rao');
    expect(payload.latest_education_level).toBe('B.Tech');
    expect(payload.skills).toBe('Python');
    expect(payload.preferred_location).toEqual([{ name: 'Pune', lat: null, lng: null }]);
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
    expect(text()).toContain('Only the recruiter who sourced this person');
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

  describe('resume', () => {
    const signedUrl = (path: string) => `${environment.apiUrl}api/files/signed-url/?file_path=${encodeURIComponent(path)}`;
    const previewData = () => (fixture.nativeElement.querySelector('object.preview') as HTMLObjectElement | null)?.getAttribute('data') ?? null;

    it('Needs info person: shows the file name, Open in new tab, an inline PDF preview from the signed link and Replace resume', () => {
      open(person({ resume_path: 'resumes/cv.pdf', resume_filename: 'cv.pdf' } as any));
      http.expectOne(signedUrl('resumes/cv.pdf')).flush({ signed_url: 'https://storage.example/cv.pdf?sig=2', expires_in: 3600 });
      fixture.detectChanges();
      let opened = '';
      component.openResume.subscribe(p => opened = p);
      expect((fixture.nativeElement.querySelector('.resume .fname') as HTMLElement).textContent).toContain('cv.pdf');
      expect(previewData()).toBe('https://storage.example/cv.pdf?sig=2');
      (fixture.nativeElement.querySelector('.open-tab') as HTMLButtonElement).click();
      expect(opened).toBe('resumes/cv.pdf');
      expect(text()).toContain('Replace resume');
      expect(text()).not.toContain('Upload resume');
      expect(text()).not.toContain('No resume yet');
    });

    it('candidate: previews the candidate\'s signed link directly (no extra signing call)', () => {
      open(candidateRow(), true);
      expect(previewData()).toBe('https://storage.example/rahul.pdf?sig=1');
      let opened = '';
      component.openResume.subscribe(p => opened = p);
      (fixture.nativeElement.querySelector('.open-tab') as HTMLButtonElement).click();
      expect(opened).toBe('https://storage.example/rahul.pdf?sig=1');
      expect((fixture.nativeElement.querySelector('.resume .fname') as HTMLElement).textContent).toContain('rahul.pdf');
    });

    it('a Word file has no preview: it says so and offers the link only', () => {
      open(candidateRow({ resume: 'https://storage.example/rahul.docx?sig=1', resume_filename: 'rahul.docx' }), true);
      expect(fixture.nativeElement.querySelector('object.preview')).toBeNull();
      expect(text()).toContain('Preview not available, open or download');
      expect(fixture.nativeElement.querySelector('.open-tab')).not.toBeNull();
    });

    it('a Word file of a Needs info person is not signed for a preview', () => {
      open(person({ resume_path: 'resumes/cv.docx', resume_filename: 'cv.docx' } as any));
      http.expectNone(r => r.url.includes('api/files/signed-url/'));
      expect(text()).toContain('Preview not available, open or download');
    });

    it('falls back to the link when the signed link cannot be fetched', () => {
      open(person({ resume_path: 'resumes/cv.pdf', resume_filename: 'cv.pdf' } as any));
      http.expectOne(signedUrl('resumes/cv.pdf')).flush({}, { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();
      expect(previewData()).toBeNull();
      expect(text()).toContain('The preview could not be loaded');
      expect(fixture.nativeElement.querySelector('.open-tab')).not.toBeNull();
    });

    it('never frames an address that is not http(s)', () => {
      open(candidateRow({ resume: 'javascript:alert(1)//x.pdf', resume_filename: 'x.pdf' }), true);
      expect(fixture.nativeElement.querySelector('object.preview')).toBeNull();
      http.expectOne(r => r.url.includes('api/files/signed-url/')).flush({ signed_url: 'javascript:alert(1)' });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('object.preview')).toBeNull();
    });

    it('no resume: says "No resume yet" and offers Upload resume to an editor, with no link and no preview', () => {
      open(person());
      expect(text()).toContain('No resume yet');
      expect(text()).toContain('Upload resume');
      expect(fixture.nativeElement.querySelector('.open-tab')).toBeNull();
      expect(fixture.nativeElement.querySelector('object.preview')).toBeNull();
      open(candidateRow({ resume: null, resume_filename: null }), true);
      expect(text()).toContain('No resume yet');
      expect(text()).toContain('Upload resume');
    });

    it('no resume and no edit rights: "No resume yet" and nothing to upload', () => {
      open(person(), false);
      expect(text()).toContain('No resume yet');
      expect(text()).not.toContain('Upload resume');
      expect(fixture.nativeElement.querySelector('input[type=file]')).toBeNull();
    });

    it('view mode with a resume shows it, and nothing to upload or replace; a chosen file is refused', () => {
      open(person({ resume_path: 'resumes/cv.pdf', resume_filename: 'cv.pdf' } as any), false);
      http.expectOne(signedUrl('resumes/cv.pdf')).flush({ signed_url: 'https://storage.example/cv.pdf?sig=2' });
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      expect(text()).toContain('Open in new tab');
      expect(previewData()).toBe('https://storage.example/cv.pdf?sig=2');
      expect(text()).not.toContain('Upload resume');
      expect(text()).not.toContain('Replace resume');
      expect(host.querySelector('input[type=file]')).toBeNull();
      component.chooseResume(pdf());
      http.expectNone(parseUrl);
      expect(component.resumeFile).toBeNull();
    });

    it('refuses a file over 20 MB or of another type with a clear message and does not read it', () => {
      open(person());
      component.chooseResume(pdf('big.pdf', 20 * 1024 * 1024 + 1));
      expect(component.parseMessage).toContain('20 MB');
      component.chooseResume(pdf('notes.txt'));
      expect(component.parseMessage).toContain('PDF, DOC or DOCX');
      component.chooseResume(pdf('empty.pdf', 0));
      expect(component.parseMessage).toContain('empty');
      http.expectNone(parseUrl);
      expect(component.resumeFile).toBeNull();
    });

    it('accepts a file of exactly 20 MB', fakeAsync(() => {
      open(person());
      startParse(pdf('limit.pdf', 20 * 1024 * 1024));
      answerStatus({ status: 'PROCESSING' });
      component.close();
      discardPeriodicTasks();
    }));

    it('reads the file, showing the spinner, and fills the fields it contains with a check-me tag', fakeAsync(() => {
      open(person());
      component.form.last_name = 'Typed';
      component.chooseResume(pdf());
      fixture.detectChanges();
      expect(text()).toContain('Reading the resume…');
      http.expectOne(parseUrl).flush({ status: 'PROCESSING', staging_id: 9 });
      tick(0);
      answerStatus({ status: 'PROCESSING' });
      tick(3000);
      answerStatus({
        status: 'COMPLETED',
        data: {
          first_name: 'Meera', last_name: '', email: 'meera@example.com', phone_number: '9123456780',
          skills: 'Python, Django, python', latest_education_level: 'B.Tech', latest_university: 'KLE',
          latest_specialization: 'CSE', year_of_graduation: '2019', current_location: 'Hubli, Karnataka',
          preferred_location: ['Pune', { name: 'Hubli, Karnataka', lat: 15.36, lng: 75.12 }], current_job_title: 'Engineer',
        },
      });
      fixture.detectChanges();
      expect(component.parsing).toBeFalse();
      expect(component.form.first_name).toBe('Meera');
      expect(component.form.last_name).toBe('Typed');           // the resume has none: left as it was
      expect(component.form.email).toBe('meera@example.com');
      expect(component.form.year_of_graduation).toBe(2019);
      expect(component.form.work_experience).toBe('Engineer');
      expect(component.skills).toEqual(['Python', 'Django']);
      expect(component.locations).toEqual([{ name: 'Pune', lat: null, lng: null }, { name: 'Hubli, Karnataka', lat: 15.36, lng: 75.12 }]);
      expect(component.currentLocation).toEqual([{ name: 'Hubli, Karnataka', lat: null, lng: null }]);
      expect(component.aiFilled.sort()).toEqual([
        'current_location', 'email', 'first_name', 'latest_education_level', 'latest_specialization', 'latest_university',
        'phone_number', 'preferred_location', 'skills', 'work_experience', 'year_of_graduation']);
      expect(component.aiFilled).not.toContain('last_name');
      expect(text()).not.toContain('Reading the resume…');
      expect((text().match(/From resume, please check/g) || []).length).toBe(11);
      expect(component.resumeFile!.name).toBe('cv.pdf');
      discardPeriodicTasks();
    }));

    it('overwrites a typed value only when the resume has one, and never blanks a value with an empty one', fakeAsync(() => {
      open(person());
      component.form.email = 'typed@example.com';
      component.form.latest_university = 'My College';
      component.skillInput = 'Go';
      component.addSkill();
      startParse();
      answerStatus({ status: 'COMPLETED', data: { first_name: 'Meera', email: '', latest_university: '   ', skills: [], preferred_location: [] } });
      expect(component.form.first_name).toBe('Meera');          // overwrites what was there (decision D5)
      expect(component.form.email).toBe('typed@example.com');
      expect(component.form.latest_university).toBe('My College');
      expect(component.skills).toEqual(['Go']);
      expect(component.aiFilled).toEqual(['first_name']);
      discardPeriodicTasks();
    }));

    it('takes the answer of the development fallback (no queue) as well', fakeAsync(() => {
      open(person());
      component.chooseResume(pdf());
      http.expectOne(parseUrl).flush({ success: true, data: { skills: ['Go'] } });
      expect(component.skills).toEqual(['Go']);
      expect(component.aiFilled).toEqual(['skills']);
      expect(component.parsing).toBeFalse();
    }));

    it('says so when the file is blank or unreadable, stays editable and keeps the file attachable', fakeAsync(() => {
      open(person());
      startParse();
      answerStatus({ status: 'FAILED' });
      fixture.detectChanges();
      expect(component.parsing).toBeFalse();
      expect(component.parseIsError).toBeTrue();
      expect(component.parseMessage).toContain('no readable text');
      expect(text()).toContain('no readable text');
      expect(component.aiFilled).toEqual([]);
      expect(component.resumeFile).not.toBeNull();
      const save = fixture.nativeElement.querySelector('button[type=submit]') as HTMLButtonElement;
      expect(save.disabled).toBeFalse();

      component.form.last_name = 'Rao';
      component.save();
      const body = http.expectOne(url).request.body as FormData;
      expect(body instanceof FormData).toBeTrue();
      expect((body.get('resume') as File).name).toBe('cv.pdf');
      expect(body.get('last_name')).toBe('Rao');
      expect(body.has('ai_filled_fields')).toBeFalse();
      discardPeriodicTasks();
    }));

    it('says the same when a finished read found nothing', fakeAsync(() => {
      open(person());
      startParse();
      answerStatus({ status: 'COMPLETED', data: {} });
      expect(component.parseMessage).toContain('no readable text');
      expect(component.resumeFile).not.toBeNull();
      discardPeriodicTasks();
    }));

    it('shows the reason when the reading fails and still lets the file be attached', fakeAsync(() => {
      open(person());
      startParse();
      answerStatus({ status: 'FAILED', error: 'Could not extract text' });
      expect(component.parseMessage).toContain('Could not extract text');
      expect(component.resumeFile).not.toBeNull();
      discardPeriodicTasks();
    }));

    it('gives up after 75 seconds with a message and keeps the file attachable', fakeAsync(() => {
      open(person());
      startParse();
      answerStatus({ status: 'PROCESSING' });
      for (let i = 1; i < 25; i++) {
        tick(3000);
        answerStatus({ status: 'PROCESSING' });
      }
      expect(component.parsing).toBeFalse();
      expect(component.parseMessage).toBe('Parsing took too long, you can still save the file.');
      expect(component.resumeFile).not.toBeNull();
      tick(30000);
      http.expectNone(r => r.url.includes('api/resume-status/'));  // polling stopped
      discardPeriodicTasks();
    }));

    it('keeps the file when the parse call itself fails', fakeAsync(() => {
      open(person());
      component.chooseResume(pdf());
      http.expectOne(parseUrl).flush({ detail: 'Duplicate' }, { status: 409, statusText: 'Conflict' });
      expect(component.parsing).toBeFalse();
      expect(component.parseIsError).toBeTrue();
      expect(component.parseMessage).toContain('You can still save the file');
      expect(component.resumeFile).not.toBeNull();
    }));

    it('Save sends multipart with the resume, the typed values and ai_filled_fields', fakeAsync(() => {
      open(person());
      startParse();
      answerStatus({ status: 'COMPLETED', data: { skills: 'Go, Rust', preferred_location: ['Pune'] } });
      component.save();
      const req = http.expectOne(url);
      expect(req.request.method).toBe('PATCH');
      const body = req.request.body as FormData;
      expect((body.get('resume') as File).name).toBe('cv.pdf');
      expect(body.get('skills')).toBe('Go, Rust');
      expect(body.get('first_name')).toBe('Asha');
      expect(JSON.parse(body.get('preferred_location') as string)).toEqual([{ name: 'Pune', lat: null, lng: null }]);
      expect(JSON.parse(body.get('ai_filled_fields') as string).sort()).toEqual(['preferred_location', 'skills']);
      req.flush({ kind: 'intake', id: 5, missing_fields: [] });
      expect(component.resumeFile).toBeNull();
      expect(component.aiFilled).toEqual([]);
      discardPeriodicTasks();
    }));

    it('cannot be saved while the file is still being read', fakeAsync(() => {
      open(person());
      startParse();
      fixture.detectChanges();
      expect((fixture.nativeElement.querySelector('button[type=submit]') as HTMLButtonElement).disabled).toBeTrue();
      component.save();
      http.expectNone(url);
      answerStatus({ status: 'PROCESSING' });
      component.close();
      discardPeriodicTasks();
    }));

    it('another person\'s email: shows the server message and keeps the file, the form and the highlights', fakeAsync(() => {
      open(person());
      startParse();
      answerStatus({ status: 'COMPLETED', data: { email: 'other@example.com', skills: 'Go' } });
      component.save();
      http.expectOne(url).flush({ email: ['This email already belongs to another person'] }, { status: 400, statusText: 'Bad Request' });
      fixture.detectChanges();
      expect(component.error).toBe('email: This email already belongs to another person');
      expect(text()).toContain('This email already belongs to another person');
      expect(component.busy).toBeFalse();
      expect(component.resumeFile!.name).toBe('cv.pdf');
      expect(component.form.email).toBe('other@example.com');
      expect(component.skills).toEqual(['Go']);
      expect(component.aiFilled.sort()).toEqual(['email', 'skills']);

      // fix the email and save again: the same file and highlights go out
      component.form.email = 'asha@example.com';
      component.save();
      const body = http.expectOne(url).request.body as FormData;
      expect((body.get('resume') as File).name).toBe('cv.pdf');
      expect(JSON.parse(body.get('ai_filled_fields') as string).sort()).toEqual(['email', 'skills']);
      discardPeriodicTasks();
    }));

    it('a bad file (400) or a scanner that is down (503) keeps the file and shows the message', fakeAsync(() => {
      open(person());
      startParse();
      answerStatus({ status: 'COMPLETED', data: { skills: 'Go' } });
      component.save();
      http.expectOne(url).flush({ detail: 'This file type is not allowed.' }, { status: 400, statusText: 'Bad Request' });
      expect(component.error).toBe('This file type is not allowed.');
      expect(component.resumeFile).not.toBeNull();
      component.save();
      http.expectOne(url).flush({ detail: 'The file scanner is not available. Please try again later.' }, { status: 503, statusText: 'Unavailable' });
      expect(component.error).toBe('The file scanner is not available. Please try again later.');
      expect(component.resumeFile).not.toBeNull();
      expect(component.skills).toEqual(['Go']);
      discardPeriodicTasks();
    }));

    it('upload with unsaved edits, then promotion: Save reports the move to Candidates', fakeAsync(() => {
      open(person());
      let emitted: any = null;
      component.updated.subscribe(e => emitted = e);
      component.form.last_name = 'Rao';                       // an edit that is not saved yet
      startParse();
      answerStatus({ status: 'COMPLETED', data: { skills: 'Go', latest_education_level: 'B.Tech', preferred_location: ['Pune'] } });
      expect(component.form.last_name).toBe('Rao');
      component.save();
      const req = http.expectOne(url);
      expect((req.request.body as FormData).get('last_name')).toBe('Rao');
      req.flush({ kind: 'candidate', id: 77, missing_fields: [], promoted: true });
      expect(emitted).toEqual({ result: jasmine.objectContaining({ promoted: true }), promoted: true });
      expect(component.busy).toBeFalse();
      discardPeriodicTasks();
    }));

    it('stops reading when the drawer is closed or destroyed', fakeAsync(() => {
      open(person());
      let closed = 0;
      component.closed.subscribe(() => closed++);
      startParse();
      answerStatus({ status: 'PROCESSING' });
      component.close();
      expect(closed).toBe(1);
      tick(30000);
      http.expectNone(r => r.url.includes('api/resume-status/'));

      startParse();
      answerStatus({ status: 'PROCESSING' });
      fixture.destroy();
      tick(30000);
      http.expectNone(r => r.url.includes('api/resume-status/'));
      discardPeriodicTasks();
    }));

    it('a new file replaces the one being read, and a new person resets the section', fakeAsync(() => {
      open(person());
      startParse(pdf('first.pdf'));
      answerStatus({ status: 'PROCESSING' });
      component.chooseResume(pdf('second.docx'));
      expect(component.resumeFile!.name).toBe('second.docx');
      http.expectOne(parseUrl).flush({ status: 'PROCESSING', staging_id: 9 });
      tick(0);
      answerStatus({ status: 'COMPLETED', data: { skills: 'Go' } });
      expect(component.aiFilled).toEqual(['skills']);

      open(person({ id: 6 }));
      expect(component.resumeFile).toBeNull();
      expect(component.aiFilled).toEqual([]);
      expect(component.parseMessage).toBe('');
      discardPeriodicTasks();
    }));

    it('takes a dropped file, for an editor only', fakeAsync(() => {
      open(person());
      const drop = (el: Element) => {
        const event = new Event('drop', { cancelable: true }) as any;
        event.dataTransfer = { files: [pdf('dropped.pdf')] };
        el.dispatchEvent(event);
      };
      drop(fixture.nativeElement.querySelector('.resume'));
      expect(component.resumeFile!.name).toBe('dropped.pdf');
      http.expectOne(parseUrl).flush({ success: true, data: { skills: 'Go' } });

      open(person({ id: 8 }), false);
      drop(fixture.nativeElement.querySelector('.resume'));
      http.expectNone(parseUrl);
    }));
  });

  describe('view mode and View full profile', () => {
    it('shows the details and the resume as plain text, with no inputs, upload or Save, for a user who cannot edit', () => {
      open(candidateRow(), false);
      const host = fixture.nativeElement as HTMLElement;
      expect(text()).toContain('Only the recruiter who sourced this person, or an admin, can change these details.');
      expect(text()).toContain('rahul@example.com');
      expect(text()).toContain('9333000111');
      expect(text()).toContain('Python');
      expect(text()).toContain('Hubli, Karnataka');
      expect(text()).toContain('Open in new tab');
      expect(host.querySelector('input')).toBeNull();
      expect(host.querySelector('form')).toBeNull();
      expect(host.querySelector('button[type=submit]')).toBeNull();
      expect(host.querySelector('input[type=file]')).toBeNull();
      expect(text()).not.toContain('Save changes');
      expect(text()).not.toContain('Upload resume');
    });

    it('does not save or verify in view mode, for either kind', () => {
      open(candidateRow({ verification_status: 'ai_unverified' }), false);
      component.kind = 'candidate';
      component.save();
      component.verify();
      http.expectNone(r => r.url.includes('api/candidates/'));
      expect(component.busy).toBeFalse();
    });

    it('emits viewProfile from the "View full profile" link, in edit and in view mode', () => {
      let count = 0;
      component.viewProfile.subscribe(() => count++);
      open(person(), true);
      (fixture.nativeElement.querySelector('.view-profile') as HTMLButtonElement).click();
      open(person(), false);
      (fixture.nativeElement.querySelector('.view-profile') as HTMLButtonElement).click();
      expect(count).toBe(2);
    });
  });

  describe('Check what the AI filled in', () => {
    const aiPerson = (o: any = {}) => person({
      verification_status: 'ai_unverified', ai_filled_fields: ['skills', 'latest_education_level', 'total_experience', 'odd_new_column'],
      missing_fields: [], ...o,
    });
    const panel = () => (fixture.nativeElement as HTMLElement).querySelector('[data-test="ai-panel"]') as HTMLElement | null;
    const tags = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.ai-tag'))
      .map(t => t.parentElement!.textContent!.replace(/\s+/g, ' ').trim());

    it('lists the AI-filled fields by readable name and highlights them when opened (no fresh upload needed)', () => {
      open(aiPerson());
      expect(panel()).not.toBeNull();
      expect(text()).toContain('Check what the AI filled in');
      const items = Array.from(panel()!.querySelectorAll('li')).map(li => li.textContent!.trim());
      expect(items).toEqual(['Skills', 'Highest qualification', 'Total experience', 'Odd new column']);
      expect(component.aiFilled).toEqual([]);                       // nothing uploaded in this session
      expect(component.isAi('skills')).toBeTrue();
      expect(component.isAi('latest_university')).toBeFalse();
      const marked = tags();
      expect(marked.length).toBe(2);                                // the two that have an input in the form
      expect(marked.some(t => t.includes('Skills') && t.includes('From resume, please check'))).toBeTrue();
      expect(marked.some(t => t.includes('Highest qualification'))).toBeTrue();
    });

    it('has no panel and no highlight for a verified person', () => {
      open(person({ verification_status: 'verified', ai_filled_fields: ['skills'] }));
      expect(panel()).toBeNull();
      expect(tags().length).toBe(0);
    });

    it('Verify in the panel verifies a Needs info person and clears the tag and the panel', () => {
      open(aiPerson());
      (panel()!.querySelector('[data-test="verify-btn"]') as HTMLButtonElement).click();
      const req = http.expectOne(`${url}verify/`);
      expect(req.request.method).toBe('POST');
      req.flush(person({ verification_status: 'verified', ai_filled_fields: [], missing_fields: [] }));
      fixture.detectChanges();
      expect(panel()).toBeNull();
      expect(tags().length).toBe(0);
    });

    it('Verify in the panel calls the candidate endpoint for a legacy candidate and clears the tag and the panel', () => {
      fixture.componentRef.setInput('kind', 'candidate');
      open(candidateRow({ verification_status: 'ai_unverified', ai_filled_fields: ['skills'] }));
      expect(tags().length).toBe(1);
      (panel()!.querySelector('[data-test="verify-btn"]') as HTMLButtonElement).click();
      http.expectNone(`${environment.apiUrl}api/candidate-intake/5/verify/`);
      http.expectOne(`${environment.apiUrl}api/candidates/5/verify/`)
        .flush({ id: 5, verification_status: 'verified', ai_filled_fields: [], missing_fields: ['education'] });
      fixture.detectChanges();
      expect(panel()).toBeNull();
      expect(tags().length).toBe(0);
    });

    it('the Verify pill beside the name does not verify', () => {
      open(aiPerson());
      const pill = (fixture.nativeElement as HTMLElement).querySelector('app-person-badges .pill.review') as HTMLElement;
      expect(pill).not.toBeNull();
      expect(pill.tagName).toBe('SPAN');
      http.expectNone(`${url}verify/`);
    });

    it('a Save that changes an AI-filled field keeps the tag and the panel', () => {
      open(aiPerson());
      component.skills = ['Python'];                                 // the recruiter edits an AI-filled field
      component.save();
      const req = http.expectOne(url);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.skills).toBe('Python');
      req.flush({ kind: 'intake', id: 5, missing_fields: [], changed: ['skills'] });
      fixture.detectChanges();
      expect(component.person.verification_status).toBe('ai_unverified');
      expect(panel()).not.toBeNull();
      expect(component.isAi('skills')).toBeTrue();
    });

    it('after Save of a fresh upload the panel lists the fields the server now holds', fakeAsync(() => {
      open(person({ missing_fields: [] }));
      expect(panel()).toBeNull();
      startParse();
      answerStatus({ status: 'COMPLETED', data: { skills: 'Python, SQL' } });
      component.save();
      http.expectOne(url).flush({ kind: 'intake', id: 5, missing_fields: [] });
      fixture.detectChanges();
      expect(component.aiFilled).toEqual([]);
      expect(panel()).not.toBeNull();
      expect(component.aiFieldLabels).toEqual(['Skills']);
      discardPeriodicTasks();
    }));

    it('a non-owner sees the panel and the highlights, without a Verify button', () => {
      open(aiPerson(), false);
      expect(panel()).not.toBeNull();
      expect(panel()!.querySelector('[data-test="verify-btn"]')).toBeNull();
      expect(panel()!.textContent).toContain('can verify them');
      expect(panel()!.querySelectorAll('li').length).toBe(4);
      expect(tags().length).toBeGreaterThan(0);                     // view mode shows the tag too
      expect(Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).some(b => b.textContent!.trim() === 'Verify')).toBeFalse();
      component.verify();
      http.expectNone(`${url}verify/`);
    });
  });

  describe('candidate kind', () => {
    const candUrl = `${environment.apiUrl}api/candidates/5/`;
    beforeEach(() => { fixture.componentRef.setInput('kind', 'candidate'); });

    it('fills the form from the candidate shape (skills as text, locations as a list)', () => {
      open(candidateRow());
      expect(component.skills).toEqual(['Python', 'SQL']);
      expect(component.locations).toEqual([{ name: 'Pune', lat: 18.5, lng: 73.8 }]);
      expect(component.currentLocation).toEqual([{ name: 'Hubli, Karnataka', lat: null, lng: null }]);
      expect(component.form.first_name).toBe('Rahul');
      expect(text()).toContain('Education');
    });

    it('reads locations stored as JSON text or as comma separated text', () => {
      open(candidateRow({ preferred_location: '[{"name":"Delhi","lat":1,"lng":2}]', current_location: '[{"name":"Goa"}]' }));
      expect(component.locations).toEqual([{ name: 'Delhi', lat: 1, lng: 2 }]);
      expect(component.currentLocation).toEqual([{ name: 'Goa', lat: null, lng: null }]);
      open(candidateRow({ preferred_location: 'Pune, Delhi' }));
      expect(component.locations.map(l => l.name)).toEqual(['Pune', 'Delhi']);
    });

    it('saves to the candidate endpoint with a partial multipart PATCH, not to Needs info, and hands back the record', () => {
      open(candidateRow());
      let emitted: any = null;
      component.updated.subscribe(e => emitted = e);
      component.form.latest_education_level = 'MCA';
      component.save();
      http.expectNone(`${environment.apiUrl}api/candidate-intake/5/`);
      const req = http.expectOne(candUrl);
      expect(req.request.method).toBe('PATCH');
      const body = req.request.body as FormData;
      expect(body instanceof FormData).toBeTrue();
      expect(body.get('latest_education_level')).toBe('MCA');
      expect(body.get('skills')).toBe('Python, SQL');
      expect(JSON.parse(body.get('preferred_location') as string)).toEqual([{ name: 'Pune', lat: 18.5, lng: 73.8 }]);
      expect(body.has('resume')).toBeFalse();
      expect(body.has('ai_filled_fields')).toBeFalse();
      const record = { id: 5, missing_fields: [] };
      req.flush(record);
      expect(emitted).toEqual({ promoted: false, candidate: jasmine.objectContaining(record), saved: true });
      expect(component.busy).toBeFalse();
    });

    it('does not claim a promotion even if the answer says so (promotion is for Needs info only)', () => {
      open(candidateRow());
      let emitted: any = null;
      component.updated.subscribe(e => emitted = e);
      component.save();
      http.expectOne(candUrl).flush({ id: 5, missing_fields: [], promoted: true });
      expect(emitted.promoted).toBeFalse();
    });

    it('shows the server message when the candidate cannot be saved', () => {
      open(candidateRow());
      component.save();
      http.expectOne(candUrl).flush({ phone_number: ['Number 123 is not 10 digits.'] }, { status: 400, statusText: 'Bad Request' });
      expect(component.error).toBe('phone number: Number 123 is not 10 digits.');
      expect(component.busy).toBeFalse();
    });

    it('verifies through the candidate endpoint', () => {
      open(candidateRow({ verification_status: 'ai_unverified' }));
      component.verify();
      const req = http.expectOne(`${candUrl}verify/`);
      expect(req.request.method).toBe('POST');
      req.flush({ id: 5, verification_status: 'verified', ai_filled_fields: [], missing_fields: ['education'] });
      expect(component.person.verification_status).toBe('verified');
      expect(component.person.kind).toBe('candidate');
    });

    it('attaches a chosen resume through its staged upload (the candidate endpoint does not take the file itself)', fakeAsync(() => {
      open(candidateRow());
      startParse();
      answerStatus({ status: 'COMPLETED', data: { latest_education_level: 'MCA' } });
      component.save();
      const body = http.expectOne(candUrl).request.body as FormData;
      expect(body.get('staging_id')).toBe('9');
      expect(body.has('resume')).toBeFalse();
      expect(body.get('latest_education_level')).toBe('MCA');
      expect(body.has('ai_filled_fields')).toBeFalse();
      discardPeriodicTasks();
    }));

    it('does not keep a file that the server could not stage (no way to attach it to a candidate)', () => {
      open(candidateRow());
      component.chooseResume(pdf());
      http.expectOne(parseUrl).flush({ detail: 'Duplicate' }, { status: 409, statusText: 'Conflict' });
      expect(component.resumeFile).toBeNull();
      expect(component.parseMessage).toContain('The file was not attached.');
      expect(component.parseMessage).not.toContain('You can still save the file');
    });

    it('a Needs info person still goes to the Needs info endpoint with the default kind', () => {
      fixture.componentRef.setInput('kind', 'intake');
      open(person());
      component.save();
      http.expectOne(url);
      http.expectNone(candUrl);
      expect(component.busy).toBeTrue();
    });
  });

  describe('resume status line and Retry', () => {
    const line = () => fixture.nativeElement.querySelector('[data-test="resume-status"]') as HTMLElement | null;
    const retryBtn = () => fixture.nativeElement.querySelector('[data-test="retry-resume"]') as HTMLButtonElement | null;
    const refreshBtn = () => fixture.nativeElement.querySelector('[data-test="refresh-resume"]') as HTMLButtonElement | null;
    const withResume = (extra: any = {}) => person({ resume_path: 'resumes/a.docx', resume_filename: 'a.docx', ...extra } as any);
    const candidateWithResume = (extra: any = {}) => candidateRow({ resume_status: 'failed', ...extra });
    const intakeRetryUrl = `${environment.apiUrl}api/candidate-intake/5/reparse-resume/`;
    const candidateRetryUrl = `${environment.apiUrl}api/candidates/5/reparse-resume/`;

    it('shows nothing for done and none, and when there is no resume file', () => {
      open(withResume({ resume_status: 'done' }));
      expect(line()).toBeNull();
      open(withResume({ resume_status: 'none' }));
      expect(line()).toBeNull();
      open(person({ resume_status: 'failed' } as any));        // no resume file stored
      expect(line()).toBeNull();
    });

    it('processing shows "Reading the resume…" with Refresh and no Retry', () => {
      open(withResume({ resume_status: 'processing' }));
      expect(line()!.textContent).toContain('Reading the resume…');
      expect(refreshBtn()).not.toBeNull();
      expect(retryBtn()).toBeNull();
    });

    it('failed and unreadable show their message with Retry', () => {
      open(withResume({ resume_status: 'failed' }));
      expect(line()!.textContent).toContain('Could not read the resume');
      expect(retryBtn()).not.toBeNull();
      open(withResume({ resume_status: 'unreadable' }));
      expect(line()!.textContent).toContain('The file has no readable text');
      expect(retryBtn()).not.toBeNull();
    });

    it('hides Retry in view mode', () => {
      open(withResume({ resume_status: 'failed' }), false);
      expect(line()).not.toBeNull();
      expect(retryBtn()).toBeNull();
      component.retryResume();
      http.expectNone(intakeRetryUrl);
    });

    it('Retry for a Needs info person posts to the intake endpoint, shows processing and tells the page', () => {
      open(withResume({ resume_status: 'failed' }));
      let updates = 0;
      component.updated.subscribe(() => updates++);
      retryBtn()!.click();
      const req = http.expectOne(intakeRetryUrl);
      expect(req.request.method).toBe('POST');
      http.expectNone(candidateRetryUrl);
      req.flush({ ...withResume(), resume_status: 'processing', resume_status_detail: 'Reading the resume' });
      fixture.detectChanges();
      expect(line()!.textContent).toContain('Reading the resume…');
      expect(retryBtn()).toBeNull();
      expect(updates).toBe(1);
      expect(component.resumeBusy).toBeFalse();
    });

    it('Retry for a candidate posts to the candidate endpoint and hands the candidate to the page', () => {
      fixture.componentRef.setInput('kind', 'candidate');
      open(candidateWithResume());
      let emitted: any = null;
      component.updated.subscribe(e => emitted = e);
      retryBtn()!.click();
      const req = http.expectOne(candidateRetryUrl);
      expect(req.request.method).toBe('POST');
      http.expectNone(intakeRetryUrl);
      req.flush({ ...candidateWithResume(), resume_status: 'processing' });
      fixture.detectChanges();
      expect(line()!.textContent).toContain('Reading the resume…');
      expect(emitted.candidate.resume_status).toBe('processing');
    });

    it('a failed Retry shows the error and keeps the status', () => {
      open(withResume({ resume_status: 'failed' }));
      component.retryResume();
      http.expectOne(intakeRetryUrl).flush({ detail: 'This person has no resume to read.' }, { status: 409, statusText: 'Conflict' });
      expect(component.resumeBusy).toBeFalse();
      expect(component.error).not.toBe('');
      expect(component.person.resume_status).toBe('failed');
    });

    it('Refresh reloads the person and tells the page only when the status changed', () => {
      open(withResume({ resume_status: 'processing' }));
      let updates = 0;
      component.updated.subscribe(() => updates++);
      refreshBtn()!.click();
      http.expectOne(url).flush({ ...withResume(), resume_status: 'processing' });
      expect(updates).toBe(0);
      component.refreshResume();
      http.expectOne(url).flush({ ...withResume(), resume_status: 'done' });
      fixture.detectChanges();
      expect(line()).toBeNull();
      expect(updates).toBe(1);
    });
  });
});

