import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobMatchingScoreService } from '../../services/job-matching-score.service';
import { AdbRequirementService } from '../../services/adb-requirement.service';
import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';
import { FormsModule } from '@angular/forms';

@Component({
    standalone: true,
    selector: 'app-job-matching-score',
    templateUrl: './job-matching-score.component.html',
    styleUrls: ['./job-matching-score.component.css'],
    imports: [CommonModule, FormsModule, RecruiterWorkflowNavbarComponent]
})
export class JobMatchingScoreComponent implements OnInit {
    availableJobs: any[] = [];
    selectedJobId: number | null = null;
    candidatesScores: any[] = [];
    isLoading = false;
    isInitialLoading = true;

    currentPage = 1;
    totalPages = 1;
    nextPageUrl: string | null = null;
    prevPageUrl: string | null = null;

    // Active tooltip tracking
    activeTooltipId: number | null = null;

    // Modal state
    selectedCandidateDetails: any = null;

    constructor(
        private jobScoreService: JobMatchingScoreService,
        private adbRequirementService: AdbRequirementService
    ) { }

    ngOnInit() {
        this.fetchJobs();
    }

    fetchJobs() {
        // Only fetches page 1 for the dropdown - depending on how many jobs there are,
        // this might need to be modified to search or load all, but we will start with page 1.
        this.adbRequirementService.getRequirements(1).subscribe(
            (res: any) => {
                const jobs = res.results || res;
                this.availableJobs = Array.isArray(jobs) ? jobs : [];
                this.isInitialLoading = false;
            },
            error => {
                console.error('Error loading jobs:', error);
                this.isInitialLoading = false;
            }
        );
    }

    onJobSelect() {
        if (!this.selectedJobId) return;
        this.loadScores(1);
    }

    loadScores(page: number) {
        if (!this.selectedJobId) return;
        this.isLoading = true;
        this.currentPage = page;
        this.activeTooltipId = null; // reset any open tooltip

        this.jobScoreService.getMatchingScores(this.selectedJobId, page).subscribe(
            (res: any) => {
                const data = res.results || res;
                this.candidatesScores = Array.isArray(data) ? data : (data.candidates || []);

                // Clean up stringified JSON locations from older candidates for the main table display
                this.candidatesScores.forEach((c: any) => {
                    let locObj = c.preferred_location || c.current_location || '';
                    try {
                        if (typeof locObj === 'string' && locObj.includes('{"name":')) {
                            const parsed = JSON.parse(locObj.replace(/'/g, '"'));
                            if (Array.isArray(parsed)) {
                                locObj = parsed.map((loc: any) => loc.name || '').filter(Boolean).join(', ');
                            }
                        }
                    } catch (e) { }
                    c.preferred_location = locObj || ''; // override with clean string
                });

                const count = res.count || this.candidatesScores.length;
                this.totalPages = Math.ceil(count / 30) || 1;
                this.nextPageUrl = res.next || null;
                this.prevPageUrl = res.previous || null;

                this.isLoading = false;
            },
            error => {
                console.error('Error loading scores:', error);
                this.isLoading = false;
                this.candidatesScores = [];
            }
        );
    }

    getScoreColorClass(score: number): string {
        if (score < 40) return 'text-red-600';
        if (score < 70) return 'text-yellow-500';
        if (score < 90) return 'text-lime-500';
        return 'text-green-600';
    }

    getScoreStrokeColor(score: number): string {
        if (score < 40) return '#dc2626'; // red-600
        if (score < 70) return '#eab308'; // yellow-500
        if (score < 90) return '#84cc16'; // lime-500
        return '#16a34a'; // green-600
    }

    getStrokeDashArray(score: number): string {
        return `${score}, 100`;
    }

    showTooltip(candidateId: number) {
        this.activeTooltipId = candidateId;
    }

    hideTooltip() {
        this.activeTooltipId = null;
    }

    openDetailsModal(candidate: any) {
        this.selectedCandidateDetails = candidate;
        this.hideTooltip(); // hide tooltip if open
    }

    closeDetailsModal() {
        this.selectedCandidateDetails = null;
    }

    getLocationText(score: number): string {
        if (score >= 100) return 'Candidate is within a 10km radius of the job location.';
        if (score >= 85) return 'Candidate distance is within a 10-25km radius.';
        if (score >= 60) return 'Candidate distance is within a 25-50km radius.';
        if (score >= 30) return 'Candidate distance is within a 50-100km radius (Consider remote or relocation).';
        if (score > 0) return 'Candidate is over 100km away (Relocation likely required).';
        return 'No overlapping location data found or extreme distance.';
    }

    getExperienceText(score: number): string {
        if (score >= 100) return 'Candidate fully meets the required years of experience.';
        if (score >= 80) return 'Candidate is very close to the required experience range.';
        if (score >= 60) return 'Candidate is somewhat outside the experience range (under or over qualified).';
        if (score >= 40) return 'Candidate falls significantly outside the requested experience range.';
        return 'Experience does not align with requirement constraints.';
    }

    getSkillsText(score: number): string {
        if (score >= 90) return 'Exceptional semantic overlap with required core skills and technologies.';
        if (score >= 75) return 'Strong overlap with core skills, some minor gaps.';
        if (score >= 50) return 'Moderate skill match; missing several key technologies.';
        return 'Poor skill alignment with the job description.';
    }

    getExperienceMeaningText(score: number): string {
        if (score >= 90) return 'Past role responsibilities and context align perfectly.';
        if (score >= 70) return 'Past work context is highly relevant to this role.';
        if (score >= 50) return 'Past work has moderate contextual relevance.';
        return 'Past work context diverges significantly from requirements.';
    }
}
