/// <reference types="google.maps" />
import { of, throwError } from 'rxjs';
import { RecruiterWorkflowCandidate } from './recruiter-workflow-candidate.component';

/**
 * Logic of the Needs info tab and the edit rule. The component is created without its constructor
 * (it needs maps, routing and several services) because only plain methods are tested here.
 */
describe('RecruiterWorkflowCandidate: Needs info and permissions', () => {
  let c: any;

  beforeEach(() => {
    c = Object.create(RecruiterWorkflowCandidate.prototype);
    c.isAdminUser = false;
    c.currentUserId = 'REC1';
  });

  describe('canEditPerson (same rule as the server)', () => {
    it('lets the recruiter who sourced the person edit', () => {
      expect(c.canEditPerson({ sourced_by_id: 'REC1' })).toBeTrue();
      expect(c.canEditPerson({ sourced_by: 'REC1' })).toBeTrue();
    });

    it('does not let another recruiter edit', () => {
      expect(c.canEditPerson({ sourced_by_id: 'REC2' })).toBeFalse();
    });

    it('does not let anyone edit a person nobody sourced, except admins', () => {
      expect(c.canEditPerson({ sourced_by_id: null })).toBeFalse();
      expect(c.canEditPerson({})).toBeFalse();
      c.isAdminUser = true;
      expect(c.canEditPerson({ sourced_by_id: null })).toBeTrue();
      expect(c.canEditPerson({ sourced_by_id: 'REC2' })).toBeTrue();
    });

    it('does not match when the signed-in user is unknown', () => {
      c.currentUserId = '';
      expect(c.canEditPerson({ sourced_by_id: '' })).toBeFalse();
      expect(c.canEditPerson({ sourced_by_id: 'REC1' })).toBeFalse();
    });
  });

  describe('Needs info helpers', () => {
    it('names a person, falling back to email, phone, then a placeholder', () => {
      expect(c.intakeName({ first_name: 'Asha', last_name: 'Rao' })).toBe('Asha Rao');
      expect(c.intakeName({ first_name: 'Asha', last_name: null })).toBe('Asha');
      expect(c.intakeName({ first_name: null, last_name: null, email: 'a@b.com' })).toBe('a@b.com');
      expect(c.intakeName({ first_name: null, last_name: null, email: null, phone_number: '9876543210' })).toBe('9876543210');
      expect(c.intakeName({})).toBe('Unnamed person');
    });

    it('knows whether a person has a resume (needed before joining a pipeline)', () => {
      expect(c.hasResume({ resume_path: 'resumes/a.pdf' })).toBeTrue();
      expect(c.hasResume({ resume_path: null })).toBeFalse();
    });

    it('shows at most five page numbers around the current page', () => {
      c.intakePage = 1; c.intakePages = 10;
      expect(c.getIntakePageNumbers()).toEqual([1, 2, 3, 4, 5]);
      c.intakePage = 6; c.intakePages = 10;
      expect(c.getIntakePageNumbers()).toEqual([4, 5, 6, 7, 8]);
      c.intakePage = 2; c.intakePages = 3;
      expect(c.getIntakePageNumbers()).toEqual([1, 2, 3]);
    });
  });

  describe('adding people from Needs info to a pipeline', () => {
    it('asks for a selection first', () => {
      const alerts: string[] = [];
      c.activeTab = 'needs_info';
      c.intakePeople = [{ id: 1, kind: 'intake', selected: false, resume_path: 'r.pdf' }];
      c.showAlert = (m: string) => alerts.push(m);
      c.openAddToWorkflowModal();
      expect(alerts[0]).toContain('select at least one candidate');
    });

    it('refuses people without a resume and names them', () => {
      const alerts: string[] = [];
      c.activeTab = 'needs_info';
      c.intakePeople = [
        { id: 1, kind: 'intake', selected: true, resume_path: 'r.pdf', first_name: 'Asha' },
        { id: 2, kind: 'intake', selected: true, resume_path: null, first_name: 'Bala', last_name: 'Iyer' },
      ];
      c.showAlert = (m: string) => alerts.push(m);
      c.loadJobsForWorkflowModal = () => fail('the job picker must not open');
      c.openAddToWorkflowModal();
      expect(alerts[0]).toContain('A resume is needed');
      expect(alerts[0]).toContain('Bala Iyer');
      expect(alerts[0]).not.toContain('Asha');
    });

    it('opens the job picker when everyone selected has a resume', () => {
      let opened = false;
      c.activeTab = 'needs_info';
      c.intakePeople = [{ id: 1, kind: 'intake', selected: true, resume_path: 'r.pdf' }, { id: 2, kind: 'intake', selected: false }];
      c.loadJobsForWorkflowModal = () => { opened = true; };
      c.openAddToWorkflowModal();
      expect(opened).toBeTrue();
      expect(c.selectedCandidateCount).toBe(1);
    });
  });

  describe('one list for candidates and people from Needs info', () => {
    it('tells the two kinds apart even when they share an id number', () => {
      expect(c.isIntakeRow({ kind: 'intake', id: 7 })).toBeTrue();
      expect(c.isIntakeRow({ kind: 'candidate', id: 7 })).toBeFalse();
      expect(c.isIntakeRow({ id: 7 })).toBeFalse();
      expect(c.rowKey(0, { kind: 'intake', id: 7 })).not.toBe(c.rowKey(0, { kind: 'candidate', id: 7 }));
      expect(c.trackByCandidate(0, { id: 7 })).toBe('candidate-7');
    });

    it('gives people from Needs info the fields the table expects', () => {
      const row = c.toRow({ kind: 'intake', id: 3, first_name: null, last_name: null, email: null, phone_number: null,
                            resume_path: 'resumes/a.pdf' });
      expect(row.first_name).toBe('');
      expect(row.email).toBe('');
      expect(row.resume).toBe('resumes/a.pdf');
      expect(row.active_applications).toEqual([]);
      expect(row.lead_pipeline).toBeNull();
      expect(row.selected).toBeFalse();
      const candidate = c.toRow({ kind: 'candidate', id: 3, first_name: 'A' });
      expect(candidate.active_applications).toBeUndefined();   // candidates are left as the server sent them
    });

    it('counts the Needs info tab as inbox people plus candidates still missing fields', () => {
      c.intakePeople = [{}, {}];
      c.intakeSummary = null;
      expect(c.needsInfoCount).toBe(2);
      c.intakeSummary = { open: 3, legacy_incomplete_candidates: 4 };
      expect(c.needsInfoCount).toBe(7);
    });

    it('knows whether a row of either kind has a resume', () => {
      expect(c.hasRowResume({ kind: 'intake', resume_path: 'a.pdf' })).toBeTrue();
      expect(c.hasRowResume({ kind: 'intake', resume_path: null })).toBeFalse();
      expect(c.hasRowResume({ resume_url: 'https://x/y.pdf' })).toBeTrue();
      expect(c.hasRowResume({})).toBeFalse();
    });

    it('asks the server for date order when Newest or Oldest is chosen, and sorts the page itself for A to Z', () => {
      const calls: string[] = [];
      c.activeTab = 'sourced';
      c.loadCandidates = (p: number) => calls.push(`candidates:${p}:${c.serverSort}`);
      c.loadIntake = (p: number) => calls.push(`intake:${p}:${c.serverSort}`);
      c.applyFiltersAndSort = () => calls.push('client');
      c.sortCandidates({ target: { value: 'oldest' } } as any);
      c.activeTab = 'needs_info';
      c.sortCandidates({ target: { value: 'newest' } } as any);
      c.sortCandidates({ target: { value: 'a-z' } } as any);
      expect(calls).toEqual(['candidates:1:oldest', 'intake:1:newest', 'client']);
    });

    it('splits a mixed selection into candidate ids and Needs info ids when adding to a pipeline', () => {
      c.activeTab = 'sourced';
      c.selectedJobId = 9;
      c.masterCandidates = [
        { id: 1, kind: 'candidate', selected: true },
        { id: 1, kind: 'intake', selected: true, resume_path: 'r.pdf' },
        { id: 2, kind: 'candidate', selected: false },
      ];
      c.intakePeople = [];
      let sent: any = null;
      c.candidateService = { addCandidatesToJob: (job: number, cands: number[], intake: number[]) => {
        sent = { job, cands, intake };
        return { subscribe: () => undefined };
      } };
      c.confirmAddToWorkflow();
      expect(sent).toEqual({ job: 9, cands: [1], intake: [1] });
    });

    it('refuses a mixed selection when a Needs info person has no resume', () => {
      const alerts: string[] = [];
      c.activeTab = 'sourced';
      c.masterCandidates = [
        { id: 1, kind: 'candidate', selected: true },
        { id: 5, kind: 'intake', selected: true, resume_path: null, first_name: 'No', last_name: 'Resume' },
      ];
      c.intakePeople = [];
      c.showAlert = (m: string) => alerts.push(m);
      c.openAddToWorkflowModal();
      expect(alerts[0]).toContain('No Resume');
    });
  });
});

/** Which card opens: the card rule of the candidate page, for both kinds of people. */
describe('RecruiterWorkflowCandidate: which card opens', () => {
  let c: any;
  let alerts: string[];

  // rows as the people list sends them (they already carry the sheet details, so nothing is fetched for them)
  const legacy = () => ({ id: 7, kind: 'candidate', first_name: 'Rahul', last_name: 'Sharma', missing_fields: ['skills'],
                          sourced_by_id: 'REC1', extra_columns: {}, import_source: null });
  const complete = () => ({ id: 8, kind: 'candidate', first_name: 'Asha', last_name: 'Rao', missing_fields: [],
                            sourced_by_id: 'REC1', extra_columns: {}, import_source: null });
  const needsInfo = () => ({ id: 3, kind: 'intake', first_name: 'Pujar', last_name: 'Naik', missing_fields: ['skills', 'education'],
                             sourced_by_id: 'REC1', extra_columns: {}, import_source: null });

  beforeEach(() => {
    alerts = [];
    c = Object.create(RecruiterWorkflowCandidate.prototype);
    c.isAdminUser = false;
    c.currentUserId = 'REC1';
    c.masterCandidates = [];
    c.intakePeople = [];
    c.detailPerson = null;
    c.sidebarPerson = null;
    c.candidateService = {
      getCandidate: jasmine.createSpy('getCandidate').and.callFake((id: number) => of({ id, first_name: 'Full', extra_columns: { Remarks: 'x' } })),
      getIntake: jasmine.createSpy('getIntake').and.callFake((id: number) => of({ id, first_name: 'Full', extra_columns: { Remarks: 'x' } })),
    };
    c.showAlert = (m: string) => alerts.push(m);
  });

  describe('a click on the name opens the detail card, for every kind and list', () => {
    it('opens the card for a candidate and for a Needs info person', () => {
      for (const row of [complete(), legacy(), needsInfo()]) {
        c.openRow(row);
        expect(c.detailPerson).toBe(row);
        expect(c.sidebarPerson).toBeNull();
      }
    });

    it('closes the sidebar when the card opens', () => {
      c.openCompleteProfile(legacy());
      c.openRow(complete());
      expect(c.sidebarPerson).toBeNull();
      expect(c.detailPerson.id).toBe(8);
    });
  });

  describe('Needs info badge, Complete profile and the edit action of an incomplete person open the sidebar', () => {
    it('opens the sidebar for a legacy candidate, saving to the candidate (not to a Needs info record)', () => {
      const row = legacy();
      c.openCompleteProfile(row);
      expect(c.sidebarPerson).toBe(row);
      expect(c.detailPerson).toBeNull();
      expect(c.sidebarKind(row)).toBe('candidate');
    });

    it('opens the sidebar for a Needs info person, saving to the Needs info record', () => {
      const row = needsInfo();
      c.openCompleteProfile(row);
      expect(c.sidebarPerson).toBe(row);
      expect(c.sidebarKind(row)).toBe('intake');
    });

    it('closes the detail card when the sidebar opens (Complete profile in the card)', () => {
      c.openRow(legacy());
      c.openCompleteProfile(c.detailPerson);
      expect(c.detailPerson).toBeNull();
      expect(c.sidebarPerson.id).toBe(7);
    });

    it('the edit action opens the sidebar for a legacy candidate and a Needs info person', () => {
      c.startEdit = () => fail('the edit form must not open for an incomplete person');
      c.editRow(legacy());
      expect(c.sidebarPerson.id).toBe(7);
      c.editRow(needsInfo());
      expect(c.sidebarPerson.id).toBe(3);
      expect(c.sidebarKind(c.sidebarPerson)).toBe('intake');
    });

    it('startEdit itself also hands an incomplete person to the sidebar', () => {
      c.startEdit(legacy());
      expect(c.sidebarPerson.id).toBe(7);
    });

    it('a user who cannot edit gets the sidebar in view mode', () => {
      const row = { ...legacy(), sourced_by_id: 'REC2' };
      c.editRow(row);
      expect(c.sidebarPerson).toBe(row);
      expect(c.canEditPerson(row)).toBeFalse();
    });
  });

  describe('a complete candidate keeps the existing edit form', () => {
    it('the edit action calls startEdit for the owner and does not open the sidebar', () => {
      const started: any[] = [];
      c.startEdit = (row: any) => started.push(row);
      const row = complete();
      c.editRow(row);
      expect(started).toEqual([row]);
      expect(c.sidebarPerson).toBeNull();
      expect(c.detailPerson).toBeNull();
    });

    it('someone who cannot edit gets the detail card instead of the form', () => {
      c.startEdit = () => fail('no edit form for a non-owner');
      c.editRow({ ...complete(), sourced_by_id: 'REC2' });
      expect(c.detailPerson.id).toBe(8);
    });

    it('the Edit button of the card closes the card and then follows the same rule', () => {
      const started: any[] = [];
      c.startEdit = (row: any) => started.push(row);
      const row = complete();
      c.openRow(row);
      c.editFromCard(row);
      expect(c.detailPerson).toBeNull();
      expect(started).toEqual([row]);
    });
  });

  describe('View full profile in the sidebar', () => {
    it('closes the sidebar and opens the detail card for the same person', () => {
      const row = legacy();
      c.openCompleteProfile(row);
      c.viewProfileFromSidebar();
      expect(c.sidebarPerson).toBeNull();
      expect(c.detailPerson).toBe(row);
    });

    it('does nothing when no sidebar is open', () => {
      c.viewProfileFromSidebar();
      expect(c.detailPerson).toBeNull();
    });
  });

  describe('rows that lack fields are completed from the server', () => {
    it('fetches the full candidate for the card and keeps the kind', () => {
      const row: any = { id: 7, first_name: 'Rahul', missing_fields: ['skills'], selected: true };   // no sheet details
      c.openRow(row);
      expect(c.candidateService.getCandidate).toHaveBeenCalledWith(7);
      expect(c.detailPerson.extra_columns).toEqual({ Remarks: 'x' });
      expect(c.detailPerson.kind).toBe('candidate');
      expect(c.detailPerson.selected).toBeTrue();
    });

    it('fetches the full candidate for the sidebar too', () => {
      c.openCompleteProfile({ id: 7, kind: 'candidate', missing_fields: ['skills'] });
      expect(c.candidateService.getCandidate).toHaveBeenCalledWith(7);
      expect(c.sidebarPerson.extra_columns).toEqual({ Remarks: 'x' });
      expect(c.sidebarKind(c.sidebarPerson)).toBe('candidate');
    });

    it('fetches a Needs info person through the Needs info endpoint', () => {
      c.openCompleteProfile({ id: 3, kind: 'intake', missing_fields: ['skills'] });
      expect(c.candidateService.getIntake).toHaveBeenCalledWith(3);
      expect(c.candidateService.getCandidate).not.toHaveBeenCalled();
    });

    it('does not fetch when the row already has everything', () => {
      c.openRow(legacy());
      c.openCompleteProfile(needsInfo());
      expect(c.candidateService.getCandidate).not.toHaveBeenCalled();
      expect(c.candidateService.getIntake).not.toHaveBeenCalled();
    });

    it('keeps the row when the fetch fails', () => {
      c.candidateService.getCandidate.and.returnValue(throwError(() => new Error('boom')));
      const row: any = { id: 7, kind: 'candidate', missing_fields: ['skills'] };
      c.openRow(row);
      expect(c.detailPerson).toBe(row);
    });

    it('ignores a late answer when another person has been opened meanwhile', () => {
      let answer: any;
      c.candidateService.getCandidate.and.returnValue({ subscribe: (o: any) => { answer = o; } });
      c.openRow({ id: 7, kind: 'candidate' });
      c.openRow(complete());
      answer.next({ id: 7, first_name: 'Late', extra_columns: {} });
      expect(c.detailPerson.id).toBe(8);
    });
  });

  describe('deep link ?person=<kind>:<id>&card=detail|sidebar', () => {
    it('opens the detail card by default, for a candidate', () => {
      c.applyPersonLink({ person: 'candidate:7' });
      expect(c.candidateService.getCandidate).toHaveBeenCalledWith(7);
      expect(c.detailPerson.id).toBe(7);
      expect(c.detailPerson.kind).toBe('candidate');
      expect(c.sidebarPerson).toBeNull();
    });

    it('opens the detail card for a Needs info person with card=detail', () => {
      c.applyPersonLink({ person: 'intake:3', card: 'detail' });
      expect(c.candidateService.getIntake).toHaveBeenCalledWith(3);
      expect(c.detailPerson.kind).toBe('intake');
    });

    it('opens the sidebar with card=sidebar, saving to the right record for either kind', () => {
      c.applyPersonLink({ person: 'candidate:7', card: 'sidebar' });
      expect(c.sidebarPerson.id).toBe(7);
      expect(c.detailPerson).toBeNull();
      expect(c.sidebarKind(c.sidebarPerson)).toBe('candidate');
      c.applyPersonLink({ person: 'intake:3', card: 'sidebar' });
      expect(c.sidebarKind(c.sidebarPerson)).toBe('intake');
    });

    it('ignores a missing or malformed link', () => {
      for (const params of [{}, { person: 'nobody' }, { person: 'candidate:abc' }, { person: 'other:5' }, { person: 'candidate:' }]) {
        c.applyPersonLink(params);
      }
      expect(c.candidateService.getCandidate).not.toHaveBeenCalled();
      expect(c.candidateService.getIntake).not.toHaveBeenCalled();
      expect(c.detailPerson).toBeNull();
    });

    it('acts once per link, so closing the card is not undone by a later query change', () => {
      c.applyPersonLink({ person: 'candidate:7' });
      c.closeDetailCard();
      c.applyPersonLink({ person: 'candidate:7', form_id: 'x' });
      expect(c.candidateService.getCandidate).toHaveBeenCalledTimes(1);
      expect(c.detailPerson).toBeNull();
      c.applyPersonLink({ person: 'candidate:9' });
      expect(c.detailPerson.id).toBe(9);
    });

    it('tells the user when the person cannot be opened', () => {
      c.candidateService.getCandidate.and.returnValue(throwError(() => ({ status: 404 })));
      c.applyPersonLink({ person: 'candidate:99' });
      expect(c.detailPerson).toBeNull();
      expect(alerts[0]).toContain('Could not open that person');
    });
  });

  describe('after the sidebar saves a candidate', () => {
    beforeEach(() => {
      c.loadIntake = jasmine.createSpy('loadIntake');
      c.loadCandidates = jasmine.createSpy('loadCandidates');
      c.loadIntakeSummary = jasmine.createSpy('loadIntakeSummary');
      c.fetchStatistics = jasmine.createSpy('fetchStatistics');
      c.intakePage = 1;
      c.currentPage = 1;
    });

    it('refreshes the row in both lists, keeps the sidebar open while fields are missing, and reloads the lists', () => {
      const row: any = { ...legacy(), selected: true };
      const twin: any = { ...legacy() };
      c.masterCandidates = [row, { ...complete() }];
      c.intakePeople = [twin];
      c.sidebarPerson = row;
      c.onIntakeUpdated({ promoted: false, saved: true, candidate: { id: 7, first_name: 'Rahul', skills: 'Go', missing_fields: ['education'] } });
      expect(row.skills).toBe('Go');
      expect(row.selected).toBeTrue();
      expect(twin.skills).toBe('Go');
      expect(c.masterCandidates[1].skills).toBeUndefined();
      expect(c.sidebarPerson.kind).toBe('candidate');
      expect(c.sidebarPerson.skills).toBe('Go');
      expect(c.loadIntake).toHaveBeenCalled();
      expect(c.loadCandidates).toHaveBeenCalled();
      expect(c.loadIntakeSummary).toHaveBeenCalled();
      expect(alerts.length).toBe(0);
    });

    it('closes the sidebar and says so when the candidate is complete now', () => {
      const row: any = legacy();
      c.masterCandidates = [row];
      c.sidebarPerson = row;
      c.onIntakeUpdated({ promoted: false, saved: true, candidate: { id: 7, missing_fields: [] } as any });
      expect(c.sidebarPerson).toBeNull();
      expect(alerts[0]).toContain('All mandatory fields are filled in');
      expect(row.missing_fields).toEqual([]);
    });

    it('a verify keeps the sidebar open even when nothing is missing', () => {
      const row: any = legacy();
      c.masterCandidates = [row];
      c.sidebarPerson = row;
      c.onIntakeUpdated({ promoted: false, candidate: { id: 7, missing_fields: [], verification_status: 'verified' } as any });
      expect(c.sidebarPerson).not.toBeNull();
      expect(c.sidebarPerson.verification_status).toBe('verified');
      expect(alerts.length).toBe(0);
    });

    it('does not touch a Needs info row that shares the id number', () => {
      const inbox: any = { id: 7, kind: 'intake', skills: 'Old', missing_fields: ['skills'] };
      c.intakePeople = [inbox];
      c.sidebarPerson = legacy();
      c.onIntakeUpdated({ promoted: false, saved: true, candidate: { id: 7, skills: 'New', missing_fields: ['education'] } as any });
      expect(inbox.skills).toBe('Old');
    });
  });

  describe('Needs info people keep working through the same sidebar', () => {
    it('a promotion closes the sidebar and reloads', () => {
      c.loadIntake = jasmine.createSpy('loadIntake');
      c.loadCandidates = jasmine.createSpy('loadCandidates');
      c.loadIntakeSummary = jasmine.createSpy('loadIntakeSummary');
      c.fetchStatistics = jasmine.createSpy('fetchStatistics');
      c.intakePage = 1;
      c.currentPage = 1;
      c.sidebarPerson = needsInfo();
      c.onIntakeUpdated({ result: { kind: 'candidate', id: 5, missing_fields: [], promoted: true }, promoted: true });
      expect(c.sidebarPerson).toBeNull();
      expect(alerts[0]).toContain('moved to Sourced Database');
    });

    it('the Verify tag (verifyClick) opens the sidebar for both kinds and never verifies from the list', () => {
      c.candidateService.verifyIntake = jasmine.createSpy('verifyIntake');
      c.candidateService.verifyCandidate = jasmine.createSpy('verifyCandidate');
      expect(c.verifyRow).toBeUndefined();            // the inline verify is gone from the page
      const intakeRow = { ...needsInfo(), verification_status: 'ai_unverified', ai_filled_fields: ['skills'] };
      c.openCompleteProfile(intakeRow);               // what (verifyClick) calls in the Needs info list
      expect(c.sidebarPerson.id).toBe(intakeRow.id);
      expect(c.sidebarKind(c.sidebarPerson)).toBe('intake');
      const legacyRow = { ...legacy(), verification_status: 'ai_unverified', ai_filled_fields: ['skills'] };
      c.openCompleteProfile(legacyRow);               // and in the Sourced Database list
      expect(c.sidebarPerson.id).toBe(legacyRow.id);
      expect(c.sidebarKind(c.sidebarPerson)).toBe('candidate');
      expect(c.candidateService.verifyIntake).not.toHaveBeenCalled();
      expect(c.candidateService.verifyCandidate).not.toHaveBeenCalled();
    });

    it('the Verify tag on the detail card (reviewAi) closes the card and opens the sidebar', () => {
      const row = { ...legacy(), verification_status: 'ai_unverified', ai_filled_fields: ['skills'] };
      c.openRow(row);
      expect(c.detailPerson).toBe(row);
      c.openCompleteProfile(c.detailPerson);          // what (reviewAi) calls
      expect(c.detailPerson).toBeNull();
      expect(c.sidebarPerson.id).toBe(row.id);
    });

    it('knows which rows are incomplete', () => {
      expect(c.isIncomplete(needsInfo())).toBeTrue();
      expect(c.isIncomplete({ id: 1, kind: 'intake', missing_fields: [] })).toBeTrue();
      expect(c.isIncomplete(legacy())).toBeTrue();
      expect(c.isIncomplete(complete())).toBeFalse();
      expect(c.isIncomplete({ id: 2 })).toBeFalse();
    });

    describe('resume status on the detail card', () => {
      beforeEach(() => {
        c.candidateService.reparseIntakeResume = jasmine.createSpy('reparseIntakeResume')
          .and.callFake((id: number) => of({ id, resume_status: 'processing', resume_status_detail: 'Reading the resume' }));
        c.candidateService.reparseCandidateResume = jasmine.createSpy('reparseCandidateResume')
          .and.callFake((id: number) => of({ id, resume_status: 'processing', resume_status_detail: 'Reading the resume' }));
      });

      it('Retry on a Needs info person calls the intake endpoint and the card shows processing', () => {
        const row: any = { ...needsInfo(), resume_status: 'failed' };
        c.intakePeople = [row];
        c.openRow(row);
        c.retryResumeFromCard(c.detailPerson);
        expect(c.candidateService.reparseIntakeResume).toHaveBeenCalledWith(3);
        expect(c.candidateService.reparseCandidateResume).not.toHaveBeenCalled();
        expect(c.detailPerson.resume_status).toBe('processing');
        expect(row.resume_status).toBe('processing');        // the list row follows
      });

      it('Retry on a candidate calls the candidate endpoint', () => {
        const row: any = { ...legacy(), resume_status: 'unreadable' };
        c.openRow(row);
        c.retryResumeFromCard(c.detailPerson);
        expect(c.candidateService.reparseCandidateResume).toHaveBeenCalledWith(row.id);
        expect(c.candidateService.reparseIntakeResume).not.toHaveBeenCalled();
        expect(c.detailPerson.resume_status).toBe('processing');
      });

      it('does not retry for somebody who cannot edit the person', () => {
        const row: any = { ...needsInfo(), sourced_by_id: 'REC2', resume_status: 'failed' };
        c.openRow(row);
        c.retryResumeFromCard(row);
        expect(c.candidateService.reparseIntakeResume).not.toHaveBeenCalled();
      });

      it('tells the user when Retry fails and keeps the card as it was', () => {
        c.candidateService.reparseIntakeResume.and.returnValue(throwError(() => new Error('boom')));
        const row: any = { ...needsInfo(), resume_status: 'failed' };
        c.openRow(row);
        c.retryResumeFromCard(c.detailPerson);
        expect(alerts[0]).toContain('Could not retry');
        expect(c.detailPerson.resume_status).toBe('failed');
      });

      it('Refresh reloads the person from the right endpoint', () => {
        const row: any = { ...needsInfo(), resume_status: 'processing' };
        c.openRow(row);
        c.candidateService.getIntake.and.returnValue(of({ id: 3, resume_status: 'done', extra_columns: {} }));
        c.refreshCardPerson(c.detailPerson);
        expect(c.candidateService.getIntake).toHaveBeenCalledWith(3);
        expect(c.detailPerson.resume_status).toBe('done');
        const cand: any = { ...legacy(), resume_status: 'processing' };
        c.openRow(cand);
        c.refreshCardPerson(c.detailPerson);
        expect(c.candidateService.getCandidate).toHaveBeenCalledWith(cand.id);
      });
    });
  });
});

