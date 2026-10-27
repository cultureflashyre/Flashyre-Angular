/// <reference types="google.maps" />
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { RecruiterWorkflowCandidate } from './recruiter-workflow-candidate.component';

/**
 * After a change to a person, every list, tab count and statistic is reloaded from the server.
 * The component is created without its constructor; the four loaders are spies.
 */
describe('RecruiterWorkflowCandidate: refresh after a change', () => {
  let c: any;

  beforeEach(() => {
    c = Object.create(RecruiterWorkflowCandidate.prototype);
    c.fb = new FormBuilder();
    c.initializeForm();
    c.skills = [];
    c.preferredLocationsList = [];
    c.currentLocationsList = [];
    c.selectedFile = null;
    c.stagingId = null;
    c.formSource = 'External';
    c.editingCandidateId = null;
    c.masterCandidates = [{ id: 1, kind: 'candidate' }];
    c.intakePeople = [];
    c.currentPage = 3;
    c.intakePage = 2;
    c.serverSort = 'newest';
    c.alerts = [] as string[];
    c.showAlert = (m: string) => c.alerts.push(m);
    c.applyFiltersAndSort = jasmine.createSpy('applyFiltersAndSort');
    c.onCancel = () => {};
    c.loadCandidates = jasmine.createSpy('loadCandidates');
    c.loadIntake = jasmine.createSpy('loadIntake');
    c.loadIntakeSummary = jasmine.createSpy('loadIntakeSummary');
    c.fetchStatistics = jasmine.createSpy('fetchStatistics');
    c.candidateService = {
      createCandidate: jasmine.createSpy('createCandidate').and.callFake(() => of({ id: 5 } as any)),
      updateCandidate: jasmine.createSpy('updateCandidate').and.callFake((id: number) => of({ id } as any)),
      deleteIntake: jasmine.createSpy('deleteIntake').and.returnValue(of({})),
      deleteCandidate: jasmine.createSpy('deleteCandidate').and.returnValue(of({})),
    };
  });

  const fillMandatory = () => {
    c.candidateForm.patchValue({ first_name: 'Meera', last_name: 'Nair' });
    c.phoneNumbersArray.at(0).setValue('9555000111');
  };
  const expectAllLoaders = (candidatePage: number, intakePage: number) => {
    expect(c.loadCandidates).toHaveBeenCalledWith(candidatePage);
    expect(c.loadIntake).toHaveBeenCalledWith(intakePage);
    expect(c.loadIntakeSummary).toHaveBeenCalledTimes(1);
    expect(c.fetchStatistics).toHaveBeenCalledTimes(1);
  };

  it('refreshAfterChange reloads the current pages, or page 1 after a create', () => {
    c.refreshAfterChange();
    expectAllLoaders(3, 2);
    c.loadCandidates.calls.reset(); c.loadIntake.calls.reset();
    c.refreshAfterChange({ goToFirstPage: true });
    expect(c.loadCandidates).toHaveBeenCalledWith(1);
    expect(c.loadIntake).toHaveBeenCalledWith(1);
  });

  it('creating a Needs info person reloads all four and inserts no row by hand', () => {
    fillMandatory();
    c.candidateService.createCandidate.and.returnValue(of({ id: 9, kind: 'intake' } as any));
    c.onSubmit();
    expectAllLoaders(1, 1);
    expect(c.masterCandidates.length).toBe(1);
    expect(c.intakePeople.length).toBe(0);
    expect(c.alerts[0]).toContain('Needs info');
  });

  it('creating a candidate reloads all four and inserts no row by hand', () => {
    fillMandatory();
    c.candidateForm.patchValue({ email: 'meera@example.com' });
    c.onSubmit();
    expectAllLoaders(1, 1);
    expect(c.masterCandidates).toEqual([{ id: 1, kind: 'candidate' }]);
    expect(c.alerts[0]).toBe('Created successfully!');
  });

  it('editing a candidate reloads all four without resetting the page', () => {
    fillMandatory();
    c.editingCandidateId = 7;
    c.onSubmit();
    expectAllLoaders(3, 2);
    expect(c.alerts[0]).toBe('Updated successfully!');
  });

  it('oldest first: the success message says the new person is on the last page', () => {
    fillMandatory();
    c.serverSort = 'oldest';
    c.onSubmit();
    expect(c.alerts[0]).toBe('Created. The list is sorted oldest first, so the new person is on the last page.');
    expectAllLoaders(1, 1);
  });

  it('deleting a Needs info person reloads all four on the same page', () => {
    c.alertMessage = ''; c.pendingAction = null;
    const person: any = { id: 4, kind: 'intake', first_name: 'A' };
    c.deleteIntakePerson(person);
    c.pendingAction();
    expect(c.candidateService.deleteIntake).toHaveBeenCalledWith(4);
    expectAllLoaders(3, 2);
  });

  it('deleting a candidate reloads all four on the same page', () => {
    c.masterCandidates = [{ id: 1 }, { id: 2 }];
    c.deleteCandidate(1);
    c.pendingAction();
    expectAllLoaders(3, 2);
  });

  it('deleting the last row of a later page steps back one page', () => {
    c.masterCandidates = [{ id: 1 }];
    c.deleteCandidate(1);
    c.pendingAction();
    expectAllLoaders(2, 2);
  });

  it('a verify or save in the sidebar reloads all four without resetting the page', () => {
    c.sidebarPerson = null;
    c.onIntakeUpdated({ promoted: false, candidate: { id: 7, missing_fields: [], verification_status: 'verified' } as any });
    expectAllLoaders(3, 2);
  });

  it('a promotion reloads all four once, on the same page', () => {
    c.sidebarPerson = null;
    c.onIntakeUpdated({ result: { kind: 'candidate', id: 5, missing_fields: [], promoted: true } as any, promoted: true });
    expectAllLoaders(3, 2);
    expect(c.loadCandidates).toHaveBeenCalledTimes(1);
  });
});
