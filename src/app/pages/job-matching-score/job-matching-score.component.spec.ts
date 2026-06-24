import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobMatchingScoreComponent } from './job-matching-score.component';
import { JobMatchingScoreService } from '../../services/job-matching-score.service';
import { AdbRequirementService } from '../../services/adb-requirement.service';
import { of, throwError } from 'rxjs';

describe('JobMatchingScoreComponent', () => {
    let component: JobMatchingScoreComponent;
    let fixture: ComponentFixture<JobMatchingScoreComponent>;
    let mockJobScoreService: jasmine.SpyObj<JobMatchingScoreService>;
    let mockAdbRequirementService: jasmine.SpyObj<AdbRequirementService>;

    beforeEach(async () => {
        mockJobScoreService = jasmine.createSpyObj('JobMatchingScoreService', ['getMatchingScores']);
        mockAdbRequirementService = jasmine.createSpyObj('AdbRequirementService', ['getRequirements']);

        // Default mock behaviors
        mockAdbRequirementService.getRequirements.and.returnValue(of({
            results: [
                { id: 1, job_role: 'Senior Python Developer' },
                { id: 2, job_role: 'Frontend Angular Developer' }
            ]
        }));

        mockJobScoreService.getMatchingScores.and.returnValue(of({
            count: 1,
            results: [
                {
                    candidate_id: 101,
                    first_name: 'John',
                    last_name: 'Doe',
                    skills: 'Python, Django',
                    total_experience: 5,
                    relevant_experience: 5,
                    current_location: 'Bengaluru',
                    preferred_location: '[{"name": "Bengaluru"}]',
                    overall_score: 95,
                    score_breakdown: {
                        skills_similarity: 90,
                        experience_similarity: 90,
                        experience_years_score: 100,
                        location_score: 100
                    }
                }
            ]
        }));

        await TestBed.configureTestingModule({
            imports: [JobMatchingScoreComponent],
            providers: [
                { provide: JobMatchingScoreService, useValue: mockJobScoreService },
                { provide: AdbRequirementService, useValue: mockAdbRequirementService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(JobMatchingScoreComponent);
        component = fixture.componentInstance;
    });

    it('should create and load initial requirements', () => {
        fixture.detectChanges(); // triggers ngOnInit and fetchJobs
        expect(component).toBeTruthy();
        expect(mockAdbRequirementService.getRequirements).toHaveBeenCalledWith(1);
        expect(component.availableJobs.length).toBe(2);
        expect(component.isInitialLoading).toBeFalse();
    });

    it('should handle error when fetching requirements', () => {
        mockAdbRequirementService.getRequirements.and.returnValue(throwError(() => new Error('API Error')));
        fixture.detectChanges();
        expect(component.availableJobs.length).toBe(0);
        expect(component.isInitialLoading).toBeFalse();
    });

    it('should load scores when a job is selected', () => {
        fixture.detectChanges();
        component.selectedJobId = 1;
        component.onJobSelect();
        expect(mockJobScoreService.getMatchingScores).toHaveBeenCalledWith(1, 1);
        expect(component.candidatesScores.length).toBe(1);
        // Verify stringified location cleanup works
        expect(component.candidatesScores[0].preferred_location).toBe('Bengaluru');
    });

    it('should correctly determine score color class', () => {
        expect(component.getScoreColorClass(95)).toBe('text-green-600');
        expect(component.getScoreColorClass(85)).toBe('text-lime-500');
        expect(component.getScoreColorClass(55)).toBe('text-yellow-500');
        expect(component.getScoreColorClass(25)).toBe('text-red-600');
    });

    it('should correctly determine stroke color', () => {
        expect(component.getScoreStrokeColor(95)).toBe('#16a34a');
        expect(component.getScoreStrokeColor(85)).toBe('#84cc16');
        expect(component.getScoreStrokeColor(55)).toBe('#eab308');
        expect(component.getScoreStrokeColor(25)).toBe('#dc2626');
    });

    it('should show and hide tooltip', () => {
        component.showTooltip(42);
        expect(component.activeTooltipId).toBe(42);
        component.hideTooltip();
        expect(component.activeTooltipId).toBeNull();
    });

    it('should open and close details modal', () => {
        const candidate = { id: 101, name: 'John Doe' };
        component.openDetailsModal(candidate);
        expect(component.selectedCandidateDetails).toEqual(candidate);
        component.closeDetailsModal();
        expect(component.selectedCandidateDetails).toBeNull();
    });

    it('should map score value to user-friendly location description text', () => {
        expect(component.getLocationText(100)).toContain('within a 10km radius');
        expect(component.getLocationText(85)).toContain('within a 10-25km radius');
        expect(component.getLocationText(60)).toContain('within a 25-50km radius');
        expect(component.getLocationText(30)).toContain('within a 50-100km radius');
        expect(component.getLocationText(10)).toContain('over 100km away');
        expect(component.getLocationText(0)).toContain('No overlapping location data');
    });

    it('should map score value to user-friendly experience description text', () => {
        expect(component.getExperienceText(100)).toContain('fully meets');
        expect(component.getExperienceText(80)).toContain('very close');
        expect(component.getExperienceText(60)).toContain('somewhat outside');
        expect(component.getExperienceText(40)).toContain('significantly outside');
        expect(component.getExperienceText(10)).toContain('does not align');
    });
});
