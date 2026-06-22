import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobMatchingScoreComponent } from './job-matching-score.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { JobMatchingScoreService } from '../../services/job-matching-score.service';
import { AdbRequirementService } from '../../services/adb-requirement.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('JobMatchingScoreComponent', () => {
  let component: JobMatchingScoreComponent;
  let fixture: ComponentFixture<JobMatchingScoreComponent>;
  let mockJobScoreService: jasmine.SpyObj<JobMatchingScoreService>;
  let mockAdbService: jasmine.SpyObj<AdbRequirementService>;

  const mockJobsResponse = {
    results: [
      { id: 1, job_role: 'Python Developer', client_name: 'Tech Corp' },
      { id: 2, job_role: 'Java Developer', client_name: 'Biz Corp' }
    ]
  };

  const mockScoresResponse = {
    count: 35, // More than page limit of 30 to test pagination
    next: 'http://api.url/next',
    previous: null,
    results: [
      {
        candidate_id: 101,
        first_name: 'Alice',
        last_name: 'Smith',
        overall_score: 95.0,
        preferred_location: '[{"name": "Bengaluru"}]', // stringified JSON
        current_location: 'Chennai',
        total_experience: 5.0,
        relevant_experience: 4.0
      },
      {
        candidate_id: 102,
        first_name: 'Bob',
        last_name: 'Jones',
        overall_score: 55.0,
        preferred_location: 'Delhi, Noida',
        current_location: 'Gurugram',
        total_experience: 3.0,
        relevant_experience: 2.0
      }
    ]
  };

  beforeEach(async () => {
    mockJobScoreService = jasmine.createSpyObj('JobMatchingScoreService', ['getMatchingScores']);
    mockAdbService = jasmine.createSpyObj('AdbRequirementService', ['getRequirements']);

    mockAdbService.getRequirements.and.returnValue(of(mockJobsResponse));
    mockJobScoreService.getMatchingScores.and.returnValue(of(mockScoresResponse));

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, JobMatchingScoreComponent],
      providers: [
        { provide: JobMatchingScoreService, useValue: mockJobScoreService },
        { provide: AdbRequirementService, useValue: mockAdbService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(JobMatchingScoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load requirements on initialization', () => {
    expect(mockAdbService.getRequirements).toHaveBeenCalledWith(1);
    expect(component.availableJobs.length).toBe(2);
    expect(component.isInitialLoading).toBeFalse();
  });

  it('should load scores on job select', () => {
    component.selectedJobId = 1;
    component.onJobSelect();
    expect(mockJobScoreService.getMatchingScores).toHaveBeenCalledWith(1, 1);
    expect(component.candidatesScores.length).toBe(2);
    expect(component.candidatesScores[0].preferred_location).toBe('Bengaluru'); // cleaned location
    expect(component.candidatesScores[1].preferred_location).toBe('Delhi, Noida');
  });

  it('should handle pagination values correctly', () => {
    component.selectedJobId = 1;
    component.loadScores(1);
    expect(component.totalPages).toBe(2); // Math.ceil(35 / 30) = 2
    expect(component.nextPageUrl).toBe('http://api.url/next');
    expect(component.prevPageUrl).toBeNull();
  });

  it('should handle API errors gracefully in loadScores', () => {
    component.selectedJobId = 1;
    mockJobScoreService.getMatchingScores.and.returnValue(throwError(() => new Error('Error loading scores')));
    component.loadScores(1);
    expect(component.isLoading).toBeFalse();
    expect(component.candidatesScores.length).toBe(0);
  });

  it('should get correct score color class names', () => {
    expect(component.getScoreColorClass(35)).toBe('text-red-600');
    expect(component.getScoreColorClass(55)).toBe('text-yellow-500');
    expect(component.getScoreColorClass(85)).toBe('text-lime-500');
    expect(component.getScoreColorClass(95)).toBe('text-green-600');
  });

  it('should get correct score stroke hex values', () => {
    expect(component.getScoreStrokeColor(35)).toBe('#dc2626');
    expect(component.getScoreStrokeColor(55)).toBe('#eab308');
    expect(component.getScoreStrokeColor(85)).toBe('#84cc16');
    expect(component.getScoreStrokeColor(95)).toBe('#16a34a');
  });

  it('should compute stroke dash array value', () => {
    expect(component.getStrokeDashArray(82)).toBe('82, 100');
  });

  it('should manage tooltip active state and candidates id', () => {
    component.showTooltip(99);
    expect(component.activeTooltipId).toBe(99);
    component.hideTooltip();
    expect(component.activeTooltipId).toBeNull();
  });

  it('should manage candidate details modal state', () => {
    const cand = { candidate_id: 101, name: 'Alice' };
    component.openDetailsModal(cand);
    expect(component.selectedCandidateDetails).toBe(cand);
    expect(component.activeTooltipId).toBeNull();

    component.closeDetailsModal();
    expect(component.selectedCandidateDetails).toBeNull();
  });

  it('should map score value to correct location explanation text', () => {
    expect(component.getLocationText(100)).toContain('within a 10km radius');
    expect(component.getLocationText(85)).toContain('within a 10-25km radius');
    expect(component.getLocationText(60)).toContain('within a 25-50km radius');
    expect(component.getLocationText(30)).toContain('within a 50-100km radius');
    expect(component.getLocationText(15)).toContain('over 100km away');
    expect(component.getLocationText(0)).toContain('No overlapping location data');
  });

  it('should map score value to correct experience level text', () => {
    expect(component.getExperienceText(100)).toContain('fully meets');
    expect(component.getExperienceText(80)).toContain('very close');
    expect(component.getExperienceText(60)).toContain('somewhat outside');
    expect(component.getExperienceText(40)).toContain('significantly outside');
    expect(component.getExperienceText(10)).toContain('does not align');
  });

  it('should map score value to correct skills overlap explanation text', () => {
    expect(component.getSkillsText(95)).toContain('Exceptional semantic overlap');
    expect(component.getSkillsText(80)).toContain('Strong overlap');
    expect(component.getSkillsText(60)).toContain('Moderate skill match');
    expect(component.getSkillsText(30)).toContain('Poor skill alignment');
  });

  it('should map score value to experience meaning explanation text', () => {
    expect(component.getExperienceMeaningText(95)).toContain('align perfectly');
    expect(component.getExperienceMeaningText(80)).toContain('highly relevant');
    expect(component.getExperienceMeaningText(60)).toContain('moderate contextual relevance');
    expect(component.getExperienceMeaningText(30)).toContain('diverges significantly');
  });
});
