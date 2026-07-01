import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobMatchingScoreService } from '../../services/job-matching-score.service';
import { AdbRequirementService } from '../../services/adb-requirement.service';
import { RecruiterSidebarComponent } from '../../components/recruiter-sidebar/recruiter-sidebar.component';

@Component({
  standalone: true,
  selector: 'app-job-matching-score',
  templateUrl: './job-matching-score.component.html',
  styleUrls: ['./job-matching-score.component.css'],
  imports: [CommonModule, FormsModule, RecruiterSidebarComponent]
})
export class JobMatchingScoreComponent implements OnInit {
  availableJobs: any[] = [];
  selectedJobId: number | null = null;
  selectedJobTitle: string = '';
  selectedClientName: string = '';

  allCandidatesScores: any[] = []; // Full list from backend
  candidatesScores: any[] = []; // Filtered list
  paginatedCandidates: any[] = []; // Sliced list for display
  skippedCandidates: any[] = []; // Candidates missing embeddings

  isLoading = false;
  isInitialLoading = true;

  // Pagination
  displayPage = 1;
  pageSize = 30;
  displayTotalPages = 1;

  // Search
  searchQuery = '';
  searchTimeout: any;

  // Stats
  strongMatchCount = 0;
  moderateCount = 0;
  avgScore = 0;

  // Modal
  selectedCandidateDetails: any = null; // Used for Score Breakdown Modal
  
  // Profile Details Modal
  showProfileModal = false;
  selectedProfileDetails: any = null;

  constructor(
    private jobScoreService: JobMatchingScoreService,
    private adbRequirementService: AdbRequirementService
  ) {}

  ngOnInit() {
    this.fetchJobs();
  }

  fetchJobs() {
    this.adbRequirementService.getActiveRequirementsList().subscribe({
      next: (res: any) => {
        // The endpoint returns a direct list now, not paginated
        this.availableJobs = Array.isArray(res) ? res : [];
        this.isInitialLoading = false;
      },
      error: (err) => {
        console.error('Error loading jobs:', err);
        this.isInitialLoading = false;
      }
    });
  }

  onJobSelect() {
    if (!this.selectedJobId) return;
    
    const job = this.availableJobs.find(j => j.id === this.selectedJobId);
    if (job) {
      this.selectedJobTitle = job.job_role;
      this.selectedClientName = job.client_name;
    }

    this.searchQuery = '';
    this.loadScores();
  }

  loadScores() {
    if (!this.selectedJobId) return;
    this.isLoading = true;

    // We can pass the search query to the backend as planned, 
    // but since the backend returns all candidates and caches them, 
    // fetching the full list and filtering client-side provides a faster UX 
    // while allowing stats to remain global for the job.
    this.jobScoreService.getMatchingScores(this.selectedJobId).subscribe({
      next: (res: any) => {
        const data = res.results || res;
        this.allCandidatesScores = Array.isArray(data) ? data : (data.candidates || []);
        this.skippedCandidates = data.skipped_candidates || [];
        
        // Clean up location strings
        this.allCandidatesScores.forEach((c: any) => {
          let locObj = c.preferred_location || c.current_location || '';
          try {
            if (typeof locObj === 'string' && locObj.includes('{"name":')) {
              const parsed = JSON.parse(locObj.replace(/'/g, '"'));
              if (Array.isArray(parsed)) {
                locObj = parsed.map((loc: any) => loc.name || '').filter(Boolean).join(', ');
              }
            }
          } catch (e) {}
          c.preferred_location = locObj || '';
        });

        this.computeStats();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading scores:', err);
        this.allCandidatesScores = [];
        this.candidatesScores = [];
        this.paginatedCandidates = [];
        this.isLoading = false;
      }
    });
  }

  computeStats() {
    this.strongMatchCount = 0;
    this.moderateCount = 0;
    let totalScore = 0;

    this.allCandidatesScores.forEach(c => {
      const score = c.score || 0;
      if (score >= 80) this.strongMatchCount++;
      else if (score >= 50) this.moderateCount++;
      totalScore += score;
    });

    if (this.allCandidatesScores.length > 0) {
      this.avgScore = Math.round(totalScore / this.allCandidatesScores.length);
    } else {
      this.avgScore = 0;
    }
  }

  onSearchChange() {
    // Debounce the search input for better performance
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  applyFilters() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.candidatesScores = [...this.allCandidatesScores];
    } else {
      this.candidatesScores = this.allCandidatesScores.filter(c => {
        const name = (c.name || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const phone = (c.phone_number || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      });
    }
    
    this.displayTotalPages = Math.ceil(this.candidatesScores.length / this.pageSize) || 1;
    this.goToPage(1);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.displayTotalPages) return;
    this.displayPage = page;
    const startIndex = (page - 1) * this.pageSize;
    this.paginatedCandidates = this.candidatesScores.slice(startIndex, startIndex + this.pageSize);
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.displayPage - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > this.displayTotalPages) {
      end = this.displayTotalPages;
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // --- UI Helpers ---

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getAvatarColor(index: number): string {
    const colors = ['bg-1', 'bg-2', 'bg-3', 'bg-4', 'bg-5', 'bg-6', 'bg-7', 'bg-8'];
    return colors[index % colors.length];
  }

  getScoreBandClass(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-mid';
    return 'score-low';
  }

  getScoreBandText(score: number): string {
    if (score >= 80) return 'Strong';
    if (score >= 50) return 'Moderate';
    return 'Weak';
  }

  getRingDashArray(score: number): string {
    // 100 is the circumference of the circle with r=15.9155
    return `${score} 100`;
  }

  getTotalSkillCount(candidate: any): number {
    return (candidate.matched_skills?.length || 0) + 
           (candidate.partial_skills?.length || 0) + 
           (candidate.missing_skills?.length || 0);
  }

  // --- Modal Methods ---

  openDetailsModal(candidate: any) {
    this.selectedCandidateDetails = candidate;
    document.body.style.overflow = 'hidden';
  }

  closeDetailsModal() {
    this.selectedCandidateDetails = null;
    document.body.style.overflow = '';
  }

  // --- Profile Details Modal Methods ---

  openProfileModal(candidate: any) {
    this.selectedProfileDetails = candidate;
    this.showProfileModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeProfileModal() {
    this.showProfileModal = false;
    this.selectedProfileDetails = null;
    document.body.style.overflow = '';
  }

  openResume(url: string | null) {
    if (url) {
      window.open(url, '_blank');
    }
  }

  formatLocationList(locationsStr: string | any[] | null | undefined): string {
    if (!locationsStr) return 'N/A';
    if (Array.isArray(locationsStr)) {
        return locationsStr.map((loc: any) => loc.name || loc).join(', ');
    }
    
    // Check if it's JSON encoded array string
    if (typeof locationsStr === 'string' && locationsStr.trim().startsWith('[')) {
        try {
            const arr = JSON.parse(locationsStr);
            if (Array.isArray(arr)) {
                return arr.map((loc: any) => loc.name || loc).join(', ');
            }
        } catch (e) {
            return locationsStr;
        }
    }
    return locationsStr;
  }

  // --- Breakdown Text Helpers ---

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

  getExperienceText(score: number): string {
    if (score >= 100) return 'Candidate fully meets the required years of experience.';
    if (score >= 80) return 'Candidate is very close to the required experience range.';
    if (score >= 60) return 'Candidate is somewhat outside the experience range (under or over qualified).';
    if (score >= 40) return 'Candidate falls significantly outside the requested experience range.';
    return 'Experience does not align with requirement constraints.';
  }

  getLocationText(score: number): string {
    if (score >= 100) return 'Candidate is within a 10km radius of the job location.';
    if (score >= 85) return 'Candidate distance is within a 10-25km radius.';
    if (score >= 60) return 'Candidate distance is within a 25-50km radius.';
    if (score >= 30) return 'Candidate distance is within a 50-100km radius (Consider remote or relocation).';
    if (score > 0) return 'Candidate is over 100km away (Relocation likely required).';
    return 'No overlapping location data found or extreme distance.';
  }
}
