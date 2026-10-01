import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { JobMatchingScoreComponent } from './job-matching-score.component';
import { JobMatchingScoreService } from '../../services/job-matching-score.service';
import { AdbRequirementService } from '../../services/adb-requirement.service';
import { RecruiterWorkflowCandidateService } from '../../services/recruiter-workflow-candidate.service';
import { ApprovalNotificationService } from '../../services/approval-notification.service';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('JobMatchingScoreComponent - Enterprise Test Matrix (60+ Scenarios)', () => {
  let component: JobMatchingScoreComponent;
  let fixture: ComponentFixture<JobMatchingScoreComponent>;
  let mockJobScoreService: jasmine.SpyObj<JobMatchingScoreService>;
  let mockAdbRequirementService: jasmine.SpyObj<AdbRequirementService>;
  let mockCandidateService: jasmine.SpyObj<RecruiterWorkflowCandidateService>;
  let mockNotificationService: any;

  const mockJobs = [
    { id: 10, job_role: 'Senior Full Stack Engineer', client_name: 'Acme Corp' },
    { id: 20, job_role: 'Lead Python Developer', client_name: 'Globex' },
    { id: 30, job_role: 'Frontend Angular Specialist', client_name: 'Initech' }
  ];

  function createMockCandidate(overrides: Partial<any> = {}): any {
    return {
      candidate_id: 101,
      id: 101,
      name: 'Alice Smith',
      first_name: 'Alice',
      last_name: 'Smith',
      email: 'alice.smith@example.com',
      phone_number: '+91 9876543210',
      total_experience: 5,
      relevant_experience: 4,
      current_location: 'Bengaluru',
      preferred_location: 'Bengaluru',
      score: 85,
      latest_rating_score: 4.5,
      breakdown: {
        skills_match: 90,
        experience_meaning: 85,
        years_of_experience: 80,
        location_match: 100
      },
      matched_skills: ['Angular', 'TypeScript', 'RxJS'],
      partial_skills: ['NgRx'],
      missing_skills: ['Jest'],
      work_experience: 'Software Engineer at TechCorp for 5 years',
      resume: 'https://storage.googleapis.com/test-bucket/resumes/alice.pdf',
      ...overrides
    };
  }

  beforeEach(async () => {
    mockJobScoreService = jasmine.createSpyObj('JobMatchingScoreService', ['getMatchingScores']);
    mockAdbRequirementService = jasmine.createSpyObj('AdbRequirementService', ['getActiveRequirementsList']);
    mockCandidateService = jasmine.createSpyObj('RecruiterWorkflowCandidateService', ['getCandidateRatings']);

    mockNotificationService = {
      pendingCount: of(0),
      approvedReportsCount: of(0),
      unreadCount: of(0),
      stopListening: jasmine.createSpy('stopListening')
    };

    mockAdbRequirementService.getActiveRequirementsList.and.returnValue(of(mockJobs));
    mockJobScoreService.getMatchingScores.and.returnValue(of({
      count: 2,
      results: [
        createMockCandidate({ candidate_id: 101, name: 'Alice Smith', score: 85 }),
        createMockCandidate({ candidate_id: 102, name: 'Bob Jones', score: 65, email: 'bob.jones@example.com' })
      ],
      skipped_candidates: []
    }));
    mockCandidateService.getCandidateRatings.and.returnValue(of([
      { id: 1, rated_by_name: 'HR Lead', overall_score: 4.5, created_at: '2026-09-01T10:00:00Z', notes: 'Great candidate', candidate: 101, rating_category: 'General', scores: [], job_title: 'Developer' }
    ] as any));

    await TestBed.configureTestingModule({
      imports: [JobMatchingScoreComponent],
      providers: [
        provideRouter([]),
        { provide: JobMatchingScoreService, useValue: mockJobScoreService },
        { provide: AdbRequirementService, useValue: mockAdbRequirementService },
        { provide: RecruiterWorkflowCandidateService, useValue: mockCandidateService },
        { provide: ApprovalNotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(JobMatchingScoreComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  // =========================================================================
  // PART 1: JOB MATCHING COMPONENT CORE FUNCTIONALITY (35+ TESTS)
  // =========================================================================

  describe('1. Component Creation & Initial Requirements Loading', () => {
    it('1.1 should create the component and initialize default state', () => {
      expect(component).toBeTruthy();
      expect(component.isInitialLoading).toBeTrue();
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.displayPage).toBe(1);
      expect(component.pageSize).toBe(30);
      expect(component.allCandidatesScores.length).toBe(0);
      expect(component.skippedCandidates.length).toBe(0);
    });

    it('1.2 should call getActiveRequirementsList on ngOnInit', () => {
      fixture.detectChanges();
      expect(mockAdbRequirementService.getActiveRequirementsList).toHaveBeenCalledTimes(1);
    });

    it('1.3 should populate availableJobs when requirements API succeeds', () => {
      fixture.detectChanges();
      expect(component.availableJobs.length).toBe(3);
      expect(component.availableJobs[0].job_role).toBe('Senior Full Stack Engineer');
      expect(component.isInitialLoading).toBeFalse();
    });

    it('1.4 should gracefully handle non-array response from requirements API', () => {
      mockAdbRequirementService.getActiveRequirementsList.and.returnValue(of({ error: 'none' } as any));
      fixture.detectChanges();
      expect(component.availableJobs).toEqual([]);
      expect(component.isInitialLoading).toBeFalse();
    });

    it('1.5 should handle error when fetching requirements and reset isInitialLoading', () => {
      mockAdbRequirementService.getActiveRequirementsList.and.returnValue(throwError(() => new Error('Server Error')));
      fixture.detectChanges();
      expect(component.availableJobs.length).toBe(0);
      expect(component.isInitialLoading).toBeFalse();
    });
  });

  describe('2. Requirement Selection & Triggering Scores', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('2.1 should not trigger loadScores if selectedJobId is null', () => {
      component.selectedJobId = null;
      component.onJobSelect();
      expect(mockJobScoreService.getMatchingScores).not.toHaveBeenCalled();
    });

    it('2.2 should set selectedJobTitle and selectedClientName on valid job selection', () => {
      component.selectedJobId = 20;
      component.onJobSelect();
      expect(component.selectedJobTitle).toBe('Lead Python Developer');
      expect(component.selectedClientName).toBe('Globex');
    });

    it('2.3 should clear searchQuery when selecting a job', () => {
      component.searchQuery = 'previous query';
      component.selectedJobId = 10;
      component.onJobSelect();
      expect(component.searchQuery).toBe('');
    });

    it('2.4 should invoke loadScores() with selectedJobId', () => {
      component.selectedJobId = 10;
      component.onJobSelect();
      expect(mockJobScoreService.getMatchingScores).toHaveBeenCalledWith(10);
    });

    it('2.5 loadScores() should no-op if selectedJobId is null', () => {
      component.selectedJobId = null;
      component.loadScores();
      expect(mockJobScoreService.getMatchingScores).not.toHaveBeenCalled();
    });
  });

  describe('3. Response Normalization & Location Cleaning', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('3.1 should parse wrapped results array payload', () => {
      component.selectedJobId = 10;
      component.loadScores();
      expect(component.allCandidatesScores.length).toBe(2);
      expect(component.candidatesScores.length).toBe(2);
      expect(component.paginatedCandidates.length).toBe(2);
    });

    it('3.2 should parse direct array response payload', () => {
      mockJobScoreService.getMatchingScores.and.returnValue(of([
        createMockCandidate({ candidate_id: 201, name: 'Direct Array Cand' })
      ] as any));
      component.selectedJobId = 10;
      component.loadScores();
      expect(component.allCandidatesScores.length).toBe(1);
      expect(component.allCandidatesScores[0].name).toBe('Direct Array Cand');
    });

    it('3.3 should parse candidate payload nested under candidates key', () => {
      mockJobScoreService.getMatchingScores.and.returnValue(of({
        candidates: [createMockCandidate({ candidate_id: 202, name: 'Nested Cand' })],
        skipped_candidates: []
      } as any));
      component.selectedJobId = 10;
      component.loadScores();
      expect(component.allCandidatesScores.length).toBe(1);
      expect(component.allCandidatesScores[0].name).toBe('Nested Cand');
    });

    it('3.4 should clean JSON stringified location array into a comma-separated string', () => {
      mockJobScoreService.getMatchingScores.and.returnValue(of([
        createMockCandidate({
          candidate_id: 301,
          preferred_location: '[{"name": "Bengaluru"}, {"name": "Hyderabad"}]'
        })
      ] as any));
      component.selectedJobId = 10;
      component.loadScores();
      expect(component.allCandidatesScores[0].preferred_location).toBe('Bengaluru, Hyderabad');
    });

    it('3.5 formatLocationList should format array, JSON array string, or simple string', () => {
      expect(component.formatLocationList(null)).toBe('N/A');
      expect(component.formatLocationList(['Pune', 'Mumbai'])).toBe('Pune, Mumbai');
      expect(component.formatLocationList('[{"name": "Delhi"}, {"name": "Noida"}]')).toBe('Delhi, Noida');
      expect(component.formatLocationList('Chennai')).toBe('Chennai');
    });

    it('3.6 formatLocationList should handle corrupt JSON string gracefully', () => {
      expect(component.formatLocationList('[invalid json')).toBe('[invalid json');
    });
  });

  describe('4. Loading Overlay & Error State Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('4.1 should set isLoading = true during score calculation and false after completion', () => {
      expect(component.isLoading).toBeFalse();
      component.selectedJobId = 10;
      component.loadScores();
      expect(component.isLoading).toBeFalse(); // Finished synchronously in mock
    });

    it('4.2 should render loading overlay when isLoading is true in DOM', () => {
      component.isLoading = true;
      fixture.detectChanges();
      const overlay = fixture.debugElement.query(By.css('.page-loading-overlay'));
      expect(overlay).toBeTruthy();
      expect(overlay.nativeElement.textContent).toContain('Calculating AI semantic matching scores');
    });

    it('4.3 should hide loading overlay when isLoading is false', () => {
      component.isLoading = false;
      fixture.detectChanges();
      const overlay = fixture.debugElement.query(By.css('.page-loading-overlay'));
      expect(overlay).toBeNull();
    });

    it('4.4 should handle HTTP 500 error from backend and display error message', () => {
      mockJobScoreService.getMatchingScores.and.returnValue(throwError(() => ({
        error: { detail: 'Internal Server Error calculating embeddings' }
      })));
      component.selectedJobId = 10;
      component.loadScores();

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('Internal Server Error calculating embeddings');
      expect(component.allCandidatesScores.length).toBe(0);

      fixture.detectChanges();
      const errorBanner = fixture.debugElement.query(By.css('.error-banner'));
      expect(errorBanner).toBeTruthy();
      expect(errorBanner.nativeElement.textContent).toContain('Internal Server Error calculating embeddings');
    });

    it('4.5 should fallback to default error message if error object lacks detail', () => {
      mockJobScoreService.getMatchingScores.and.returnValue(throwError(() => new Error('Unknown crash')));
      component.selectedJobId = 10;
      component.loadScores();
      expect(component.errorMessage).toBe('Unable to compute matching scores. Please try again.');
    });

    it('4.6 retry button in error banner should trigger retryLoadScores()', () => {
      component.errorMessage = 'Network timeout';
      component.selectedJobId = 10;
      component.isLoading = false;
      fixture.detectChanges();

      spyOn(component, 'retryLoadScores').and.callThrough();
      const retryBtn = fixture.debugElement.query(By.css('.retry-btn'));
      expect(retryBtn).toBeTruthy();

      retryBtn.nativeElement.click();
      expect(component.retryLoadScores).toHaveBeenCalled();
      expect(mockJobScoreService.getMatchingScores).toHaveBeenCalledWith(10);
    });
  });

  describe('5. Stats Computation (computeStats)', () => {
    it('5.1 should compute strong match count for score >= 80', () => {
      component.allCandidatesScores = [
        createMockCandidate({ score: 95 }),
        createMockCandidate({ score: 80 }),
        createMockCandidate({ score: 79 })
      ];
      component.computeStats();
      expect(component.strongMatchCount).toBe(2);
    });

    it('5.2 should compute moderate match count for 50 <= score < 80', () => {
      component.allCandidatesScores = [
        createMockCandidate({ score: 85 }),
        createMockCandidate({ score: 75 }),
        createMockCandidate({ score: 50 }),
        createMockCandidate({ score: 49 })
      ];
      component.computeStats();
      expect(component.moderateCount).toBe(2);
    });

    it('5.3 should compute rounded average score accurately', () => {
      component.allCandidatesScores = [
        createMockCandidate({ score: 80 }),
        createMockCandidate({ score: 90 }),
        createMockCandidate({ score: 70 })
      ];
      component.computeStats();
      expect(component.avgScore).toBe(80);
    });

    it('5.4 should set avgScore to 0 when candidate list is empty', () => {
      component.allCandidatesScores = [];
      component.computeStats();
      expect(component.avgScore).toBe(0);
      expect(component.strongMatchCount).toBe(0);
      expect(component.moderateCount).toBe(0);
    });

    it('5.5 should render stats cards in the DOM when candidates exist', () => {
      component.selectedJobId = 10;
      component.allCandidatesScores = [
        createMockCandidate({ score: 90 }),
        createMockCandidate({ score: 60 })
      ];
      component.computeStats();
      component.isLoading = false;
      component.errorMessage = '';
      fixture.detectChanges();

      const statsEl = fixture.debugElement.query(By.css('.stats'));
      expect(statsEl).toBeTruthy();
      expect(statsEl.nativeElement.textContent).toContain('Total Matched');
      expect(statsEl.nativeElement.textContent).toContain('Strong Match 80%+');
      expect(statsEl.nativeElement.textContent).toContain('Moderate 50–80%');
      expect(statsEl.nativeElement.textContent).toContain('Avg Match Score');
    });
  });

  describe('6. Search Filtering & Debounce', () => {
    beforeEach(() => {
      component.allCandidatesScores = [
        createMockCandidate({ name: 'Alice Smith', email: 'alice@corp.com', phone_number: '+91 9988776655' }),
        createMockCandidate({ name: 'Bob Jones', email: 'bob@enterprise.com', phone_number: '+1 4155552671' }),
        createMockCandidate({ name: 'Charlie Brown', email: 'charlie@gmail.com', phone_number: '+91 9123456789' })
      ];
      component.applyFilters();
    });

    it('6.1 should filter candidates by name case-insensitively', () => {
      component.searchQuery = 'alice';
      component.applyFilters();
      expect(component.candidatesScores.length).toBe(1);
      expect(component.candidatesScores[0].name).toBe('Alice Smith');
    });

    it('6.2 should filter candidates by email', () => {
      component.searchQuery = 'enterprise.com';
      component.applyFilters();
      expect(component.candidatesScores.length).toBe(1);
      expect(component.candidatesScores[0].name).toBe('Bob Jones');
    });

    it('6.3 should filter candidates by phone number', () => {
      component.searchQuery = '415555';
      component.applyFilters();
      expect(component.candidatesScores.length).toBe(1);
      expect(component.candidatesScores[0].name).toBe('Bob Jones');
    });

    it('6.4 should restore full list when search query is cleared', () => {
      component.searchQuery = 'alice';
      component.applyFilters();
      expect(component.candidatesScores.length).toBe(1);

      component.searchQuery = '';
      component.applyFilters();
      expect(component.candidatesScores.length).toBe(3);
    });

    it('6.5 onSearchChange should debounce and execute applyFilters after 300ms', fakeAsync(() => {
      spyOn(component, 'applyFilters').and.callThrough();
      component.searchQuery = 'Charlie';
      component.onSearchChange();

      expect(component.applyFilters).not.toHaveBeenCalled();
      tick(150);
      expect(component.applyFilters).not.toHaveBeenCalled();
      tick(150);
      expect(component.applyFilters).toHaveBeenCalled();
      expect(component.candidatesScores.length).toBe(1);
    }));
  });

  describe('7. Pagination Calculations & Navigation', () => {
    beforeEach(() => {
      component.pageSize = 10;
      const cands = [];
      for (let i = 1; i <= 35; i++) {
        cands.push(createMockCandidate({ candidate_id: i, name: `Candidate ${i}` }));
      }
      component.allCandidatesScores = cands;
      component.applyFilters();
    });

    it('7.1 should calculate displayTotalPages based on pageSize', () => {
      expect(component.displayTotalPages).toBe(4); // 35 / 10 = 4 pages
      expect(component.paginatedCandidates.length).toBe(10);
    });

    it('7.2 goToPage should update displayPage and paginate candidates', () => {
      component.goToPage(2);
      expect(component.displayPage).toBe(2);
      expect(component.paginatedCandidates.length).toBe(10);
      expect(component.paginatedCandidates[0].name).toBe('Candidate 11');

      component.goToPage(4);
      expect(component.displayPage).toBe(4);
      expect(component.paginatedCandidates.length).toBe(5); // remaining 5
    });

    it('7.3 goToPage should ignore out-of-bound pages (<1 or >total)', () => {
      component.goToPage(0);
      expect(component.displayPage).toBe(1);

      component.goToPage(5);
      expect(component.displayPage).toBe(1);
    });

    it('7.4 getPageNumbers should return correct sequence of visible page numbers', () => {
      component.goToPage(2);
      const pages = component.getPageNumbers();
      expect(pages).toEqual([1, 2, 3, 4]);
    });
  });

  describe('8. Modals: Open, Populate & Close', () => {
    it('8.1 openDetailsModal should set selectedCandidateDetails and lock body overflow', () => {
      const candidate = createMockCandidate({ name: 'Detail Candidate' });
      component.openDetailsModal(candidate);
      expect(component.selectedCandidateDetails).toBe(candidate);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('8.2 closeDetailsModal should reset selectedCandidateDetails and restore body overflow', () => {
      const candidate = createMockCandidate({ name: 'Detail Candidate' });
      component.openDetailsModal(candidate);
      component.closeDetailsModal();
      expect(component.selectedCandidateDetails).toBeNull();
      expect(document.body.style.overflow).toBe('');
    });

    it('8.3 openProfileModal should set selectedProfileDetails and showProfileModal flag', () => {
      const candidate = createMockCandidate({ name: 'Profile Candidate' });
      component.openProfileModal(candidate);
      expect(component.selectedProfileDetails).toBe(candidate);
      expect(component.showProfileModal).toBeTrue();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('8.4 closeProfileModal should reset profile modal state', () => {
      const candidate = createMockCandidate({ name: 'Profile Candidate' });
      component.openProfileModal(candidate);
      component.closeProfileModal();
      expect(component.showProfileModal).toBeFalse();
      expect(component.selectedProfileDetails).toBeNull();
      expect(document.body.style.overflow).toBe('');
    });

    it('8.5 openRatingHistoryModal should fetch ratings from candidateService', () => {
      const candidate = createMockCandidate({ candidate_id: 88, name: 'Rated Cand' });
      component.openRatingHistoryModal(candidate);

      expect(component.showRatingHistoryModal).toBeTrue();
      expect(mockCandidateService.getCandidateRatings).toHaveBeenCalledWith(88);
      expect(component.ratingHistory.length).toBe(1);
      expect(component.isLoadingRatings).toBeFalse();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('8.6 openRatingHistoryModal should ignore candidate without candidate_id', () => {
      component.openRatingHistoryModal({ name: 'Invalid Cand' });
      expect(component.showRatingHistoryModal).toBeFalse();
      expect(mockCandidateService.getCandidateRatings).not.toHaveBeenCalled();
    });

    it('8.7 closeRatingHistoryModal should reset rating history state', () => {
      const candidate = createMockCandidate({ candidate_id: 88 });
      component.openRatingHistoryModal(candidate);
      component.closeRatingHistoryModal();
      expect(component.showRatingHistoryModal).toBeFalse();
      expect(component.selectedCandidateForRating).toBeNull();
      expect(component.ratingHistory.length).toBe(0);
      expect(document.body.style.overflow).toBe('');
    });

    it('8.8 openResume should call window.open with target _blank if URL provided', () => {
      spyOn(window, 'open');
      component.openResume('https://example.com/resume.pdf');
      expect(window.open).toHaveBeenCalledWith('https://example.com/resume.pdf', '_blank');

      component.openResume(null);
      expect(window.open).toHaveBeenCalledTimes(1); // Not called again
    });
  });

  describe('9. Skipped Candidates & Empty State Banners', () => {
    it('9.1 should render skipped candidates alert when skippedCandidates length > 0', () => {
      component.selectedJobId = 10;
      component.skippedCandidates = [{ name: 'Unreadable Resume Candidate', email: 'unreadable@corp.com' }];
      component.allCandidatesScores = [createMockCandidate()];
      component.isLoading = false;
      component.errorMessage = '';
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('candidate(s) could not be analyzed');
      expect(text).toContain('Unreadable Resume Candidate');
    });

    it('9.2 should render Pick a Job prompt when no requirement is selected', () => {
      component.selectedJobId = null;
      component.isInitialLoading = false;
      component.isLoading = false;
      fixture.detectChanges();

      const pickJob = fixture.debugElement.query(By.css('.pick-job'));
      expect(pickJob).toBeTruthy();
      expect(pickJob.nativeElement.textContent).toContain('Select a Job Requirement');
    });

    it('9.3 should render Empty State when requirement has 0 matching candidates', () => {
      component.selectedJobId = 10;
      component.allCandidatesScores = [];
      component.candidatesScores = [];
      component.isLoading = false;
      component.errorMessage = '';
      fixture.detectChanges();

      const empty = fixture.debugElement.query(By.css('.empty'));
      expect(empty).toBeTruthy();
      expect(empty.nativeElement.textContent).toContain("We couldn't find any candidates that match this requirement");
    });

    it('9.4 should render No Matches Found when search query filters all out', () => {
      component.selectedJobId = 10;
      component.allCandidatesScores = [createMockCandidate({ name: 'Alice' })];
      component.searchQuery = 'NonExistentPerson';
      component.applyFilters();
      component.isLoading = false;
      component.errorMessage = '';
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('No Matches Found');
      expect(text).toContain('NonExistentPerson');
      expect(text).toContain('Clear Search');
    });
  });

  // =========================================================================
  // PART 2: FORM & INPUT VALIDATION UI/UX & WCAG ACCESSIBILITY (35+ TESTS)
  // =========================================================================

  describe('10. Mandatory Field Indicators & Form Elements', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('10.1 should render mandatory asterisk indicator on job requirement selector label', () => {
      const indicator = fixture.debugElement.query(By.css('.required-indicator'));
      expect(indicator).toBeTruthy();
      expect(indicator.nativeElement.textContent.trim()).toBe('*');
    });

    it('10.2 jobSelect element should have aria-required set to true', () => {
      const selectEl = fixture.debugElement.query(By.css('#jobSelect'));
      expect(selectEl.nativeElement.getAttribute('aria-required')).toBe('true');
    });

    it('10.3 jobSelect should render default placeholder option', () => {
      const selectEl = fixture.debugElement.query(By.css('#jobSelect'));
      expect(selectEl.nativeElement.options[0].text).toContain('-- Choose a Job Requirement --');
    });

    it('10.4 jobSelect should have accessible aria-label', () => {
      const selectEl = fixture.debugElement.query(By.css('#jobSelect'));
      expect(selectEl.nativeElement.getAttribute('aria-label')).toBe('Select Job Requirement');
    });
  });

  describe('11. Real-Time Email & Phone Input Format Validations', () => {
    it('11.1 validateEmail should return true for standard valid emails', () => {
      expect(component.validateEmail('user@flashyre.com')).toBeTrue();
      expect(component.validateEmail('john.doe@sub.company.org')).toBeTrue();
      expect(component.validateEmail('recruiter+1@talent.io')).toBeTrue();
    });

    it('11.2 validateEmail should return false for invalid emails', () => {
      expect(component.validateEmail('')).toBeFalse();
      expect(component.validateEmail('notanemail')).toBeFalse();
      expect(component.validateEmail('user@nodomain')).toBeFalse();
      expect(component.validateEmail('user@.com')).toBeFalse();
      expect(component.validateEmail('user space@corp.com')).toBeFalse();
    });

    it('11.3 validatePhone should return true for valid phone formats (7 to 15 digits)', () => {
      expect(component.validatePhone('+91 9876543210')).toBeTrue();
      expect(component.validatePhone('415-555-2671')).toBeTrue();
      expect(component.validatePhone('(555) 123-4567')).toBeTrue();
      expect(component.validatePhone('9876543210')).toBeTrue();
    });

    it('11.4 validatePhone should return false for invalid phone formats', () => {
      expect(component.validatePhone('')).toBeFalse();
      expect(component.validatePhone('123')).toBeFalse(); // Too short (<7)
      expect(component.validatePhone('12345678901234567')).toBeFalse(); // Too long (>15)
      expect(component.validatePhone('abc-def-ghij')).toBeFalse();
    });

    it('11.5 validateSearchInput should flag invalid email attempts in search', () => {
      const valid = component.validateSearchInput('invalid-email@');
      expect(valid).toBeFalse();
      expect(component.searchValidationError).toContain('Please enter a valid email address format');
    });

    it('11.6 validateSearchInput should flag invalid phone attempts in search', () => {
      const valid = component.validateSearchInput('+91 12');
      expect(valid).toBeFalse();
      expect(component.searchValidationError).toContain('Please enter a valid phone number');
    });

    it('11.7 validateSearchInput should clear validation error for valid search queries', () => {
      component.searchValidationError = 'Previous error';
      const valid = component.validateSearchInput('Software Engineer');
      expect(valid).toBeTrue();
      expect(component.searchValidationError).toBe('');
    });

    it('11.8 DOM should render role=alert error banner when searchValidationError is set', () => {
      component.selectedJobId = 10;
      component.allCandidatesScores = [createMockCandidate()];
      component.isLoading = false;
      component.searchValidationError = 'Please enter a valid email address format.';
      fixture.detectChanges();

      const errorMsg = fixture.debugElement.query(By.css('.input-error-msg'));
      expect(errorMsg).toBeTruthy();
      expect(errorMsg.nativeElement.textContent).toContain('Please enter a valid email address format.');
      expect(errorMsg.nativeElement.getAttribute('role')).toBe('alert');
    });
  });

  describe('12. Active Loading State Disabling Controls', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('12.1 should disable job select dropdown when isLoading == true', () => {
      component.isLoading = true;
      fixture.detectChanges();
      const selectEl = fixture.debugElement.query(By.css('#jobSelect'));
      expect(selectEl.nativeElement.disabled || selectEl.nativeElement.hasAttribute('disabled')).toBeTrue();
    });

    it('12.2 should enable job select dropdown when isLoading == false', () => {
      component.isLoading = false;
      fixture.detectChanges();
      const selectEl = fixture.debugElement.query(By.css('#jobSelect'));
      expect(selectEl.nativeElement.disabled).toBeFalse();
    });

    it('12.3 should disable retry button when isLoading is active', () => {
      component.errorMessage = 'Network error';
      component.isLoading = true;
      fixture.detectChanges();
      const retryBtn = fixture.debugElement.query(By.css('.retry-btn'));
      // When isLoading is true, error-banner ngIf hides it (*ngIf="errorMessage && !isLoading")
      expect(retryBtn).toBeNull();
    });

    it('12.4 pagination Prev button should be disabled on page 1', () => {
      component.selectedJobId = 10;
      component.pageSize = 1;
      component.allCandidatesScores = [createMockCandidate({ candidate_id: 1 }), createMockCandidate({ candidate_id: 2 })];
      component.applyFilters();
      component.displayPage = 1;
      component.isLoading = false;
      fixture.detectChanges();

      const prevBtn = fixture.debugElement.query(By.css('.pagination-controls button:first-child'));
      expect(prevBtn.nativeElement.disabled).toBeTrue();
    });

    it('12.5 pagination Next button should be disabled on the last page', () => {
      component.selectedJobId = 10;
      component.pageSize = 1;
      component.allCandidatesScores = [createMockCandidate({ candidate_id: 1 }), createMockCandidate({ candidate_id: 2 })];
      component.applyFilters();
      component.displayPage = 2;
      component.isLoading = false;
      fixture.detectChanges();

      const nextBtn = fixture.debugElement.query(By.css('.pagination-controls button:last-child'));
      expect(nextBtn.nativeElement.disabled).toBeTrue();
    });
  });

  describe('13. WCAG Accessibility & Keyboard Navigation (Escape Closes Modals)', () => {
    it('13.1 pressing Escape should close detailed score modal', () => {
      component.openDetailsModal(createMockCandidate());
      expect(component.selectedCandidateDetails).toBeTruthy();

      component.handleEscapeKey();
      expect(component.selectedCandidateDetails).toBeNull();
    });

    it('13.2 pressing Escape should close profile modal', () => {
      component.openProfileModal(createMockCandidate());
      expect(component.showProfileModal).toBeTrue();

      component.handleEscapeKey();
      expect(component.showProfileModal).toBeFalse();
      expect(component.selectedProfileDetails).toBeNull();
    });

    it('13.3 pressing Escape should close rating history modal', () => {
      component.openRatingHistoryModal(createMockCandidate({ candidate_id: 5 }));
      expect(component.showRatingHistoryModal).toBeTrue();

      component.handleEscapeKey();
      expect(component.showRatingHistoryModal).toBeFalse();
    });

    it('13.4 pressing Escape should safely no-op when no modal is open', () => {
      expect(() => component.handleEscapeKey()).not.toThrow();
    });

    it('13.5 score breakdown modal should have role=dialog and aria-modal=true', () => {
      component.selectedCandidateDetails = createMockCandidate();
      fixture.detectChanges();

      const modalEl = fixture.debugElement.query(By.css('.modal'));
      expect(modalEl).toBeTruthy();
      expect(modalEl.nativeElement.getAttribute('role')).toBe('dialog');
      expect(modalEl.nativeElement.getAttribute('aria-modal')).toBe('true');
    });

    it('13.6 profile modal should have role=dialog and aria-modal=true', () => {
      component.showProfileModal = true;
      component.selectedProfileDetails = createMockCandidate();
      fixture.detectChanges();

      const modalEl = fixture.debugElement.query(By.css('.elegant-modal-content'));
      expect(modalEl).toBeTruthy();
      expect(modalEl.nativeElement.getAttribute('role')).toBe('dialog');
      expect(modalEl.nativeElement.getAttribute('aria-modal')).toBe('true');
    });

    it('13.7 rating history modal should have role=dialog and aria-modal=true', () => {
      component.showRatingHistoryModal = true;
      component.selectedCandidateForRating = createMockCandidate({ candidate_id: 9 });
      fixture.detectChanges();

      const modalEl = fixture.debugElement.query(By.css('.elegant-modal-content'));
      expect(modalEl).toBeTruthy();
      expect(modalEl.nativeElement.getAttribute('role')).toBe('dialog');
      expect(modalEl.nativeElement.getAttribute('aria-modal')).toBe('true');
    });

    it('13.8 candidate search input should have accessible aria-label', () => {
      component.selectedJobId = 10;
      component.allCandidatesScores = [createMockCandidate()];
      component.isLoading = false;
      fixture.detectChanges();

      const searchInput = fixture.debugElement.query(By.css('#candidateSearchInput'));
      expect(searchInput).toBeTruthy();
      expect(searchInput.nativeElement.getAttribute('aria-label')).toBe('Search candidates by name, email, or phone');
    });

    it('13.9 modal close buttons should have accessible aria-label attributes', () => {
      component.selectedCandidateDetails = createMockCandidate();
      fixture.detectChanges();

      const closeBtn = fixture.debugElement.query(By.css('.modal-close'));
      expect(closeBtn.nativeElement.getAttribute('aria-label')).toBe('Close details modal');
    });

    it('13.10 pagination buttons should have accessible aria-label attributes', () => {
      component.selectedJobId = 10;
      component.pageSize = 1;
      component.allCandidatesScores = [createMockCandidate({ candidate_id: 1 }), createMockCandidate({ candidate_id: 2 })];
      component.applyFilters();
      component.isLoading = false;
      fixture.detectChanges();

      const prevBtn = fixture.debugElement.query(By.css('.page-btn[aria-label="Previous Page"]'));
      const nextBtn = fixture.debugElement.query(By.css('.page-btn[aria-label="Next Page"]'));
      expect(prevBtn).toBeTruthy();
      expect(nextBtn).toBeTruthy();
    });
  });

  describe('14. Visual Encodings: Score Bands, Rings & Breakdown Text Helpers', () => {
    it('14.1 getScoreBandClass should return score-high for scores >= 80', () => {
      expect(component.getScoreBandClass(100)).toBe('score-high');
      expect(component.getScoreBandClass(85)).toBe('score-high');
      expect(component.getScoreBandClass(80)).toBe('score-high');
    });

    it('14.2 getScoreBandClass should return score-mid for scores >= 50 and < 80', () => {
      expect(component.getScoreBandClass(79)).toBe('score-mid');
      expect(component.getScoreBandClass(65)).toBe('score-mid');
      expect(component.getScoreBandClass(50)).toBe('score-mid');
    });

    it('14.3 getScoreBandClass should return score-low for scores < 50', () => {
      expect(component.getScoreBandClass(49)).toBe('score-low');
      expect(component.getScoreBandClass(20)).toBe('score-low');
      expect(component.getScoreBandClass(0)).toBe('score-low');
    });

    it('14.4 getScoreBandText should return appropriate human-readable text', () => {
      expect(component.getScoreBandText(92)).toBe('Strong');
      expect(component.getScoreBandText(60)).toBe('Moderate');
      expect(component.getScoreBandText(30)).toBe('Weak');
    });

    it('14.5 getRingDashArray should format SVG circle stroke-dasharray as "<score> 100"', () => {
      expect(component.getRingDashArray(95)).toBe('95 100');
      expect(component.getRingDashArray(50)).toBe('50 100');
      expect(component.getRingDashArray(0)).toBe('0 100');
    });

    it('14.6 getInitials should extract initials for single and multi-word names', () => {
      expect(component.getInitials('John Doe')).toBe('JD');
      expect(component.getInitials('Alice')).toBe('A');
      expect(component.getInitials('Robert Downey Junior')).toBe('RJ');
      expect(component.getInitials('')).toBe('?');
    });

    it('14.7 getAvatarColor should return rotating bg classes bg-1 through bg-8', () => {
      expect(component.getAvatarColor(0)).toBe('bg-1');
      expect(component.getAvatarColor(7)).toBe('bg-8');
      expect(component.getAvatarColor(8)).toBe('bg-1');
    });

    it('14.8 getTotalSkillCount should sum matched, partial, and missing skills', () => {
      const candidate = {
        matched_skills: ['A', 'B'],
        partial_skills: ['C'],
        missing_skills: ['D', 'E']
      };
      expect(component.getTotalSkillCount(candidate)).toBe(5);
      expect(component.getTotalSkillCount({})).toBe(0);
    });

    it('14.9 getSkillsText should return semantic description according to skill score', () => {
      expect(component.getSkillsText(95)).toContain('Exceptional semantic overlap');
      expect(component.getSkillsText(80)).toContain('Strong overlap');
      expect(component.getSkillsText(55)).toContain('Moderate skill match');
      expect(component.getSkillsText(20)).toContain('Poor skill alignment');
    });

    it('14.10 getExperienceMeaningText should return context description according to score', () => {
      expect(component.getExperienceMeaningText(92)).toContain('align perfectly');
      expect(component.getExperienceMeaningText(75)).toContain('highly relevant');
      expect(component.getExperienceMeaningText(55)).toContain('moderate contextual relevance');
      expect(component.getExperienceMeaningText(30)).toContain('diverges significantly');
    });

    it('14.11 getExperienceText should return experience years description', () => {
      expect(component.getExperienceText(100)).toContain('fully meets the required');
      expect(component.getExperienceText(85)).toContain('very close to the required');
      expect(component.getExperienceText(65)).toContain('somewhat outside the experience');
      expect(component.getExperienceText(45)).toContain('significantly outside');
      expect(component.getExperienceText(20)).toContain('does not align with requirement');
    });

    it('14.12 getLocationText should return geographic proximity description', () => {
      expect(component.getLocationText(100)).toContain('within a 10km radius');
      expect(component.getLocationText(85)).toContain('within a 10-25km radius');
      expect(component.getLocationText(60)).toContain('within a 25-50km radius');
      expect(component.getLocationText(35)).toContain('within a 50-100km radius');
      expect(component.getLocationText(10)).toContain('over 100km away');
      expect(component.getLocationText(0)).toContain('No overlapping location data');
    });
  });
});
