/// <reference types="google.maps" />
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
      c.intakePeople = [{ id: 1, selected: false, resume_path: 'r.pdf' }];
      c.showAlert = (m: string) => alerts.push(m);
      c.openAddToWorkflowModal();
      expect(alerts[0]).toContain('select at least one person');
    });

    it('refuses people without a resume and names them', () => {
      const alerts: string[] = [];
      c.activeTab = 'needs_info';
      c.intakePeople = [
        { id: 1, selected: true, resume_path: 'r.pdf', first_name: 'Asha' },
        { id: 2, selected: true, resume_path: null, first_name: 'Bala', last_name: 'Iyer' },
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
      c.intakePeople = [{ id: 1, selected: true, resume_path: 'r.pdf' }, { id: 2, selected: false }];
      c.loadJobsForWorkflowModal = () => { opened = true; };
      c.openAddToWorkflowModal();
      expect(opened).toBeTrue();
      expect(c.selectedCandidateCount).toBe(1);
    });
  });
});
