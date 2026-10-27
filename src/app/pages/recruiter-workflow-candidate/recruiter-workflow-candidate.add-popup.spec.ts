/// <reference types="google.maps" />
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { RecruiterWorkflowCandidate } from './recruiter-workflow-candidate.component';

/**
 * The Add Candidate popup: only first name, last name and a 10-digit phone number are mandatory.
 * The component is created without its constructor; the form is built with initializeForm and a plain
 * FormBuilder, and onSubmit runs against a fake candidate service.
 */
describe('RecruiterWorkflowCandidate: Add Candidate popup mandatory fields', () => {
  let c: any;

  beforeEach(() => {
    c = Object.create(RecruiterWorkflowCandidate.prototype);
    c.fb = new FormBuilder();
    c.initializeForm();
    c.skills = [];
    c.preferredLocationsList = [];
    c.currentLocationsList = [];
    c.selectedFile = null;
    c.selectedFileName = '';
    c.showFileError = false;
    c.stagingId = null;
    c.formSource = 'External';
    c.editingCandidateId = null;
    c.masterCandidates = [];
    c.alerts = [] as string[];
    c.showAlert = (m: string) => c.alerts.push(m);
    c.applyFiltersAndSort = () => {};
    c.onCancel = () => {};
    c.currentPage = 1;
    c.intakePage = 1;
    c.serverSort = 'newest';
    c.loadCandidates = jasmine.createSpy('loadCandidates');
    c.loadIntake = jasmine.createSpy('loadIntake');
    c.loadIntakeSummary = jasmine.createSpy('loadIntakeSummary');
    c.fetchStatistics = jasmine.createSpy('fetchStatistics');
    c.candidateService = {
      createCandidate: jasmine.createSpy('createCandidate').and.callFake((fd: FormData) => of({ id: 1 } as any)),
      updateCandidate: jasmine.createSpy('updateCandidate').and.callFake((id: number, fd: FormData) => of({ id } as any)),
    };
  });

  const fillMandatory = () => {
    c.candidateForm.patchValue({ first_name: 'Meera', last_name: 'Nair' });
    c.phoneNumbersArray.at(0).setValue('9555000111');
  };
  const sent = (): FormData => c.candidateService.createCandidate.calls.mostRecent().args[0];
  const keys = (fd: FormData): string[] => Array.from((fd as any).keys());

  describe('form validity', () => {
    it('is valid with only first name, last name and one phone', () => {
      fillMandatory();
      expect(c.candidateForm.valid).toBeTrue();
    });

    it('is invalid when first name, last name or phone is missing', () => {
      fillMandatory();
      c.candidateForm.patchValue({ first_name: '' });
      expect(c.candidateForm.valid).toBeFalse();
      c.candidateForm.patchValue({ first_name: 'Meera', last_name: '' });
      expect(c.candidateForm.valid).toBeFalse();
      c.candidateForm.patchValue({ last_name: 'Nair' });
      c.phoneNumbersArray.at(0).setValue('');
      expect(c.candidateForm.valid).toBeFalse();
    });

    it('is invalid when no phone control is left', () => {
      fillMandatory();
      c.phoneNumbersArray.clear();
      expect(c.candidateForm.valid).toBeFalse();
    });

    it('rejects a malformed phone number', () => {
      fillMandatory();
      c.phoneNumbersArray.at(0).setValue('12345');
      expect(c.candidateForm.valid).toBeFalse();
    });

    it('stays valid with every optional field empty', () => {
      fillMandatory();
      c.candidateForm.patchValue({
        email: '', total_experience: null, relevant_experience: null, expected_ctc_min: null,
        expected_ctc_max: null, current_ctc: null, preferred_location: '', current_location: '',
        notice_period: '', gender: '', work_experience: '', skills: '', latest_education_level: '',
        latest_university: '',
      });
      expect(c.candidateForm.valid).toBeTrue();
      c.candidateForm.reset();            // what onCancel does: every control becomes null
      c.phoneNumbersArray.at(0).setValue('9555000111');
      c.candidateForm.patchValue({ first_name: 'Meera', last_name: 'Nair' });
      expect(c.candidateForm.valid).toBeTrue();
    });

    it('only the three mandatory controls have the required validator', () => {
      const required = Object.keys(c.candidateForm.controls).filter(k => {
        const ctrl = c.candidateForm.get(k);
        // the phone array requires its own entries (each phone control is required and 10 digits)
        return k === 'phone_numbers' ? !!ctrl.at(0).errors?.['required'] : !!ctrl.errors?.['required'];
      });
      expect(required.sort()).toEqual(['first_name', 'last_name', 'phone_numbers']);
    });

    it('still checks the format of optional values that are entered', () => {
      fillMandatory();
      c.candidateForm.patchValue({ email: 'not-an-email' });
      expect(c.candidateForm.valid).toBeFalse();
      c.candidateForm.patchValue({ email: 'meera@example.com', total_experience: 120 });
      expect(c.candidateForm.valid).toBeFalse();
      c.candidateForm.patchValue({ total_experience: 4, current_ctc: 5.555 });
      expect(c.candidateForm.valid).toBeFalse();
      c.candidateForm.patchValue({ current_ctc: 5.5 });
      expect(c.candidateForm.valid).toBeTrue();
    });

    it('cross-field checks still apply when both values are entered, and ignore empty ones', () => {
      fillMandatory();
      c.candidateForm.patchValue({ expected_ctc_min: 10, expected_ctc_max: 5 });
      expect(c.candidateForm.valid).toBeFalse();
      c.candidateForm.patchValue({ expected_ctc_min: 10, expected_ctc_max: '' });
      expect(c.candidateForm.valid).toBeTrue();
      c.candidateForm.patchValue({ total_experience: 2, relevant_experience: 5 });
      expect(c.candidateForm.valid).toBeFalse();
      c.candidateForm.patchValue({ total_experience: '', relevant_experience: 5 });
      expect(c.candidateForm.valid).toBeTrue();
    });
  });

  describe('save', () => {
    it('works with no resume file', () => {
      fillMandatory();
      c.onSubmit();
      expect(c.candidateService.createCandidate).toHaveBeenCalledTimes(1);
      expect(c.showFileError).toBeFalse();
      expect(keys(sent())).not.toContain('resume');
    });

    it('sends only the fields that have values', () => {
      fillMandatory();
      c.onSubmit();
      expect(keys(sent()).sort()).toEqual(['first_name', 'last_name', 'phone_number', 'source']);
      expect(sent().get('phone_number')).toBe('9555000111');
    });

    it('sends optional values once they are filled, and no empty strings or NaN', () => {
      fillMandatory();
      c.candidateForm.patchValue({ email: 'meera@example.com', total_experience: 4, notice_period: '', gender: '', current_ctc: null });
      c.skills = ['Python'];
      c.candidateForm.controls['skills'].setValue('Python');
      c.preferredLocationsList = [{ name: 'Pune', lat: null, lng: null }];
      c.onSubmit();
      const fd = sent();
      expect(fd.get('email')).toBe('meera@example.com');
      expect(fd.get('total_experience')).toBe('4');
      expect(fd.get('skills')).toBe('Python');
      expect(JSON.parse(fd.get('preferred_location') as string)).toEqual([{ name: 'Pune', lat: null, lng: null }]);
      expect(keys(fd)).not.toContain('notice_period');
      expect(keys(fd)).not.toContain('gender');
      expect(keys(fd)).not.toContain('current_ctc');
      Array.from((fd as any).values()).forEach((v: any) => {
        expect(String(v).trim()).not.toBe('');
        expect(String(v)).not.toBe('NaN');
      });
    });

    it('does not submit and lists only the invalid fields when a mandatory one is missing', () => {
      c.candidateForm.patchValue({ first_name: 'Meera' });
      c.onSubmit();
      expect(c.candidateService.createCandidate).not.toHaveBeenCalled();
      expect(c.alerts.length).toBe(1);
      expect(c.alerts[0]).toContain('last name');
      expect(c.alerts[0]).toContain('Phone Numbers');
      expect(c.alerts[0]).not.toContain('first name');
      expect(c.alerts[0]).not.toContain('email');
      expect(c.alerts[0]).not.toContain('Resume');
    });

    it('does not submit a malformed email, and names only the email', () => {
      fillMandatory();
      c.candidateForm.patchValue({ email: 'nope' });
      c.onSubmit();
      expect(c.candidateService.createCandidate).not.toHaveBeenCalled();
      expect(c.alerts[0]).toBe('Please check the following fields: email');
    });

    it('shows the server message for a duplicate phone number', () => {
      fillMandatory();
      c.candidateService.createCandidate.and.returnValue(throwError(() => ({
        status: 400, error: { phone_number: ['Phone number 9555000111 is already registered with another candidate.'] },
      })));
      c.onSubmit();
      expect(c.alerts[0]).toContain('already registered');
      expect(c.isSubmitting).toBeFalse();
    });

    it('a person the server keeps in Needs info (no email) refreshes every list and count', () => {
      fillMandatory();
      c.candidateService.createCandidate.and.returnValue(of({ id: 9, kind: 'intake' } as any));
      c.onSubmit();
      expect(c.loadIntake).toHaveBeenCalledWith(1);
      expect(c.loadCandidates).toHaveBeenCalledWith(1);
      expect(c.loadIntakeSummary).toHaveBeenCalled();
      expect(c.masterCandidates.length).toBe(0);
      expect(c.alerts[0]).toContain('Needs info');
    });

    it('edit mode updates the candidate and keeps working with empty optional fields', () => {
      fillMandatory();
      c.editingCandidateId = 7;
      c.onSubmit();
      expect(c.candidateService.updateCandidate).toHaveBeenCalledTimes(1);
      const [id, fd] = c.candidateService.updateCandidate.calls.mostRecent().args;
      expect(id).toBe(7);
      // an emptied preferred location is still sent when editing, so it can be cleared
      expect(fd.get('preferred_location')).toBe('[]');
      expect(keys(fd)).not.toContain('email');
    });
  });
});
