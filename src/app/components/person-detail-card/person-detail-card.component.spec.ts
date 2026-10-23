import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PersonDetailCardComponent } from './person-detail-card.component';
import { environment } from '../../../environments/environment';

const candidate: any = {
  id: 11, kind: 'candidate', first_name: 'Asha', last_name: 'Rao', phone_number: '9876543210', email: 'asha@example.com',
  current_location: 'Pune', preferred_location: '[{"name":"Mumbai"},{"name":"Goa"}]', total_experience: 6, relevant_experience: 4,
  current_ctc: '12', expected_ctc_min: 15, expected_ctc_max: 18, notice_period: '30 days', skills: 'Python, Django ,SQL',
  latest_education_level: 'B.Tech', latest_university: 'COEP', latest_specialization: 'CS', resume: 'processing/a.pdf',
  resume_filename: 'asha.pdf', missing_fields: [], verification_status: 'verified', ai_filled_fields: [],
  active_applications: [{ id: 1, job_id: 2, job_role: 'Backend Dev', client_name: 'Acme', stage: 'Screening', recruiter_name: 'Ravi', recruiter_id: 'R1', updated_at: null }],
};

const intake: any = {
  id: 7, uuid: 'u-1', kind: 'intake', status: 'open', promoted_candidate: null, first_name: 'Pujar', last_name: 'Naik',
  phone_number: '9000000000', email: 'p@example.com', current_location: 'Hubli', total_experience: 3, relevant_experience: 2,
  notice_period: 'Immediate', skills: 'Java', skills_list: ['Java', 'Spring'], preferred_locations: [{ name: 'Bengaluru', lat: null, lng: null }],
  education: [{ level: 'MCA', institution: 'KLE', specialization: 'Computer Applications', year: 2020, is_highest: true }],
  missing_fields: ['skills', 'education'], verification_status: 'verified', ai_filled_fields: [], source: 'Excel Import',
  sourced_by: 'R1', sourced_by_name: 'Ravi', resume_path: 'processing/p.pdf', resume_filename: 'p.pdf', submissions: [],
  created_at: '', updated_at: '',
};

describe('PersonDetailCardComponent', () => {
  let fixture: ComponentFixture<PersonDetailCardComponent>;
  let component: PersonDetailCardComponent;
  let http: HttpTestingController;
  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => el().textContent!.replace(/\s+/g, ' ');
  const q = (sel: string) => el().querySelector(sel) as HTMLElement | null;

  function create(person: any, canEdit = true) {
    fixture = TestBed.createComponent(PersonDetailCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('person', person);
    fixture.componentRef.setInput('canEdit', canEdit);
    fixture.detectChanges();
  }

  function openTab(id: string) {
    (q(`[data-tab="${id}"]`) as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PersonDetailCardComponent, HttpClientTestingModule] });
    http = TestBed.inject(HttpTestingController);
  });

  it('shows contact, experience, education and skills for a candidate', () => {
    create(candidate);
    expect(text()).toContain('Asha Rao');
    expect(q('.candidate-avatar')!.textContent).toContain('AR');
    expect(q('[data-test="phone"]')!.textContent).toContain('9876543210');
    expect(q('[data-test="email"]')!.textContent).toContain('asha@example.com');
    expect(q('[data-test="location"]')!.textContent).toContain('Pune');
    expect(q('[data-test="total-exp"]')!.textContent).toContain('6 Yrs');
    expect(q('[data-test="preferred"]')!.textContent).toContain('Mumbai, Goa');
    expect(text()).toContain('12 LPA');
    expect(text()).toContain('15 - 18 LPA');
    expect(q('[data-test="education-row"]')!.textContent).toContain('COEP');
    const skills = Array.from(el().querySelectorAll('[data-test="skill"]')).map(s => s.textContent!.trim());
    expect(skills).toEqual(['Python', 'Django', 'SQL']);
  });

  it('shows the same sections for a Needs info person', () => {
    create(intake);
    expect(text()).toContain('Pujar Naik');
    expect(q('[data-test="phone"]')!.textContent).toContain('9000000000');
    expect(q('[data-test="total-exp"]')!.textContent).toContain('3 Yrs');
    expect(q('[data-test="preferred"]')!.textContent).toContain('Bengaluru');
    expect(q('[data-test="education-row"]')!.textContent).toContain('KLE');
    expect(q('[data-test="education-row"]')!.textContent).toContain('2020');
    const skills = Array.from(el().querySelectorAll('[data-test="skill"]')).map(s => s.textContent!.trim());
    expect(skills).toEqual(['Java', 'Spring']);
    expect(text()).toContain('Needs info');
  });

  it('shows Complete profile only with missing fields and emits completeProfile', () => {
    create(candidate);
    expect(q('[data-test="complete-btn"]')).toBeNull();
    expect(q('[data-test="edit-btn"]')).not.toBeNull();

    create(intake);
    const btn = q('[data-test="complete-btn"]') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    let emitted = 0;
    component.completeProfile.subscribe(() => emitted++);
    btn.click();
    expect(emitted).toBe(1);
    // an incomplete person goes through Complete profile, not the full edit form
    expect(q('[data-test="edit-btn"]')).toBeNull();
  });

  it('hides Edit for a non-owner and emits edit for the owner', () => {
    create(candidate, false);
    expect(q('[data-test="edit-btn"]')).toBeNull();

    create(candidate, true);
    let emitted = 0;
    component.edit.subscribe(() => emitted++);
    (q('[data-test="edit-btn"]') as HTMLButtonElement).click();
    expect(emitted).toBe(1);
  });

  describe('resume status line', () => {
    const strip = () => q('[data-test="resume-status"]');

    it('shows nothing for done, none and people without a resume file', () => {
      create({ ...candidate, resume_status: 'done' });
      expect(strip()).toBeNull();
      create({ ...candidate, resume_status: 'none' });
      expect(strip()).toBeNull();
      create({ ...candidate });
      expect(strip()).toBeNull();
      create({ ...candidate, resume: '', resume_status: 'failed' });
      expect(strip()).toBeNull();
    });

    it('processing shows "Reading the resume…" with Refresh that emits refreshPerson', () => {
      create({ ...intake, resume_status: 'processing' });
      expect(strip()!.textContent).toContain('Reading the resume…');
      expect(q('[data-test="retry-resume"]')).toBeNull();
      let refreshed = 0;
      component.refreshPerson.subscribe(() => refreshed++);
      (q('[data-test="refresh-resume"]') as HTMLButtonElement).click();
      expect(refreshed).toBe(1);
    });

    it('failed and unreadable show their message with Retry for editors, which emits retryResume', () => {
      let retried = 0;
      for (const [status, message] of [['failed', 'Could not read the resume'], ['unreadable', 'The file has no readable text']]) {
        create({ ...candidate, resume_status: status }, true);
        expect(strip()!.textContent).toContain(message);
        component.retryResume.subscribe(() => retried++);
        (q('[data-test="retry-resume"]') as HTMLButtonElement).click();
      }
      expect(retried).toBe(2);
    });

    it('hides Retry in view mode but keeps the message', () => {
      create({ ...candidate, resume_status: 'failed' }, false);
      expect(strip()!.textContent).toContain('Could not read the resume');
      expect(q('[data-test="retry-resume"]')).toBeNull();
    });
  });

  it('lists the sheet columns and import source as plain text, never as HTML', () => {
    create({
      ...intake,
      import_source: { file_name: 'oct.xlsx', row_number: 14, batch_id: 3, imported_at: '2026-10-20T10:00:00Z' },
      extra_columns: { Remarks: '<script>window.__pwned = 1</script><b>bold</b>', Client: 'Acme' },
    });
    openTab('sheet');
    const rows = el().querySelectorAll('[data-test="sheet-row"]');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('<script>window.__pwned = 1</script><b>bold</b>');
    expect(el().querySelector('script')).toBeNull();
    expect(el().querySelector('.kv b')).toBeNull();
    expect((window as any).__pwned).toBeUndefined();
    expect(q('[data-test="import-source"]')!.textContent).toContain('oct.xlsx');
    expect(q('[data-test="import-source"]')!.textContent).toContain('14');
    expect(text()).toContain('Acme');
  });

  it('truncates long sheet values with Show more / Show less', () => {
    const long = 'x'.repeat(1500);
    create({ ...candidate, extra_columns: { Notes: long } });
    openTab('sheet');
    const value = () => q('.kv-value')!.textContent!;
    expect(value().length).toBeLessThan(300);
    const toggle = q('.link-btn') as HTMLButtonElement;
    expect(toggle.textContent).toContain('Show more');
    toggle.click();
    fixture.detectChanges();
    expect(value().length).toBe(1500);
    expect(q('.link-btn')!.textContent).toContain('Show less');
  });

  it('shows an empty message on the sheet tab when there is nothing from a sheet', () => {
    create(candidate);
    openTab('sheet');
    expect(q('[data-test="no-sheet"]')).not.toBeNull();
  });

  it('shows "No resume yet" when there is no resume, and disables the header button', () => {
    create({ ...intake, resume_path: null, resume_filename: null });
    openTab('resume');
    expect(q('[data-test="no-resume"]')!.textContent).toContain('No resume yet');
    expect(q('[data-test="resume-card"]')).toBeNull();
    expect((q('[data-test="resume-btn"]') as HTMLButtonElement).disabled).toBeTrue();
  });

  it('emits the resume path for both kinds', () => {
    const opened: string[] = [];
    create(intake);
    component.openResume.subscribe(v => opened.push(v));
    openTab('resume');
    expect(q('[data-test="resume-card"]')!.textContent).toContain('p.pdf');
    (q('[data-test="resume-card"]') as HTMLElement).click();

    create(candidate);
    component.openResume.subscribe(v => opened.push(v));
    (q('[data-test="resume-btn"]') as HTMLButtonElement).click();
    expect(opened).toEqual(['processing/p.pdf', 'processing/a.pdf']);
  });

  it('switches tabs and shows Applications only when the person has any', () => {
    create(intake);
    expect(el().querySelector('[data-tab="applications"]')).toBeNull();
    expect(Array.from(el().querySelectorAll('.tab')).map(t => t.textContent!.trim()))
      .toEqual(['Overview', 'Resume', 'Notes', 'From the sheet']);

    create(candidate);
    expect(q('.tab.active')!.textContent).toContain('Overview');
    openTab('applications');
    expect(q('.tab.active')!.textContent).toContain('Applications');
    expect(q('[data-test="application"]')!.textContent).toContain('Backend Dev');
    expect(q('[data-test="phone"]')).toBeNull();
    openTab('overview');
    expect(q('[data-test="phone"]')).not.toBeNull();
  });

  it('shows the notes of the person with the right kind', () => {
    create(intake);
    openTab('notes');
    http.expectOne(`${environment.apiUrl}api/candidate-notes/?intake_id=7`).flush([]);
    fixture.detectChanges();
    expect(text()).toContain('No notes yet');
    http.verify();
  });

  it('emits closed from the close button, the backdrop and Escape, but not from clicks inside', () => {
    create(candidate);
    let closed = 0;
    component.closed.subscribe(() => closed++);
    (q('[data-test="close-btn"]') as HTMLButtonElement).click();
    expect(closed).toBe(1);
    q('.elegant-modal-content')!.click();
    expect(closed).toBe(1);
    q('.elegant-modal-backdrop')!.click();
    expect(closed).toBe(2);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closed).toBe(3);
  });
  describe('placement and sheet details', () => {
    it('shows no placement block for an unplaced person', () => {
      create(candidate);
      expect(q('[data-test="placement"]')).toBeNull();
    });

    it('shows a Hired placement with placer, job, client and cooldown', () => {
      create({ ...candidate, placement_status: 'Hired', placement_at: new Date().toISOString(), placed_by_name: 'Ravi',
        placement_job_title: 'Backend Dev', placement_client_name: 'Acme' });
      const t = q('[data-test="placement"]')!.textContent!.replace(/\s+/g, ' ');
      expect(q('[data-test="placement-status"]')!.textContent).toContain('Hired');
      expect(t).toContain('Placed by Ravi');
      expect(t).toContain('Backend Dev');
      expect(t).toContain('Acme');
      expect(q('[data-test="cooldown"]')).not.toBeNull();
    });

    it('shows an Offered placement without cooldown', () => {
      create({ ...candidate, placement_status: 'Offered', placement_at: new Date().toISOString() });
      expect(q('[data-test="placement-status"]')!.textContent).toContain('Offered');
      expect(q('[data-test="cooldown"]')).toBeNull();
    });

    it('shows no cooldown for an old hire', () => {
      create({ ...candidate, placement_status: 'Hired', placement_at: '2020-01-01T00:00:00Z' });
      expect(q('[data-test="cooldown"]')).toBeNull();
    });

    it('lists import_metadata under From the sheet, prominent keys first, skipping empty and technical keys', () => {
      create({ ...candidate, import_metadata: {
        comments: 'Good <b>fit</b>', client: 'Acme', recruiter: 'Ravi', spoc: 'Sunil', status: 'Screening', l1_feedback: 'Strong', l1_date: 'None',
        sub_client: '', sheet_name: 'Oct', row_number: 4, batch_id: 'b1', file_name: 'f.xlsx', imported_at: 'x', invalid_email: 'bad',
        extra_columns: { A: 'B' }, recruiter_raw: 'raw', custom_flag: 'yes'
      } });
      openTab('sheet');
      const rows = Array.from(el().querySelectorAll('[data-test="meta-row"]')).map(r => r.querySelector('dt')!.textContent!.trim() + ' ' + r.querySelector('dd')!.textContent!.replace(/\s+/g, ' ').trim());
      expect(rows.slice(0, 6)).toEqual([
        'Recruiter Ravi', 'SPOC Sunil', 'Client Acme', 'Status Screening', 'L1 feedback Strong', 'Tracker comments Good <b>fit</b>'
      ]);
      expect(rows).toContain('Sheet Oct');
      expect(rows).toContain('Custom flag yes');
      const all = rows.join('|');
      expect(all).not.toContain('Sub client');
      expect(all).not.toContain('L1 date');
      expect(all).not.toContain('bad');
      expect(all).not.toContain('raw');
      expect(all).not.toContain('b1');
      expect(el().querySelector('[data-test="import-meta"] b')).toBeNull();
      expect(q('[data-test="no-sheet"]')).toBeNull();
    });
  });

  describe('Verify tag', () => {
    const unverified = { ...intake, verification_status: 'ai_unverified', ai_filled_fields: ['skills'] };

    it('is a button for an editor; clicking it emits reviewAi and verifies nothing', () => {
      create(unverified, true);
      let emitted = 0;
      component.reviewAi.subscribe(() => emitted++);
      const pill = q('button.review') as HTMLButtonElement;
      expect(pill).not.toBeNull();
      pill.click();
      expect(emitted).toBe(1);
      http.expectNone(r => r.url.includes('verify'));
    });

    it('is a plain pill for someone who cannot edit', () => {
      create(unverified, false);
      expect(q('button.review')).toBeNull();
      expect(q('.pill.review')).not.toBeNull();
    });
  });
});
