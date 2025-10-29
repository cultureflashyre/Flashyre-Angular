// candidate-job-detail-view.component.ts

import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { JobsService } from '../../services/job.service';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

@Component({
  selector: 'candidate-job-detail-view',
  templateUrl: './candidate-job-detail-view.component.html',
  styleUrls: ['./candidate-job-detail-view.component.css'],
  // Animation for the filter popup
  animations: [
    trigger('popupAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'scale(0.3) translateY(-10px)',
      })),
      transition(':enter', [
        animate('300ms ease-out', keyframes([
          style({ opacity: 0, transform: 'scale(0.3) translateY(-10px)', offset: 0 }),
          style({ opacity: 0.5, transform: 'scale(0.8) translateY(0px)', offset: 0.3 }),
          style({ opacity: 1, transform: 'scale(1) translateY(0px)', offset: 1 }),
        ]))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({
          opacity: 0,
          transform: 'scale(0.8) translateY(-10px)',
        }))
      ])
    ])
  ]
})
export class CandidateJobDetailView implements OnInit, OnDestroy {
  selectedJobId: number | null = null;
  selectedJob: any | null = null;
  public activeTab: 'recommended' | 'saved' | 'applied' = 'recommended';

  isLoading: boolean = true;
  errorMessage: string | null = null;

  // Master lists for each category (unfiltered data)
  private masterRecommendedJobs: any[] = [];
  private masterSavedJobs: any[] = [];
  private masterAppliedJobs: any[] = [];

  // Filtered lists for each category
  private filteredRecommendedJobs: any[] = [];
  private filteredSavedJobs: any[] = [];
  private filteredAppliedJobs: any[] = [];

  // This list is bound to the job-cards component
  public jobsToDisplay: any[] = [];

  // Properties for Filtering and Preferences
  private destroy$ = new Subject<void>();

  // Main search bar models
  searchJobTitle: string = '';
  searchLocation: string = '';
  searchExperience: string = '';

  // "More Filters" popup models
  searchDatePosted: string = '';
  searchExperienceLevel: string = '';
  searchSalary: string = '';
  searchCompanyName: string = '';
  searchWorkMode: string = '';
  searchJobType: string = '';
  searchRole: string = '';

  // UI State for popup
  showMoreFilters: boolean = false;
  public initialFilterTab: 'filters' | 'preferences' = 'filters';
  noMatchesFound: boolean = false;

  @ViewChild('filterIcon', { static: false }) filterIcon!: ElementRef;
  filterPosition = { top: 0, left: 0 };

  constructor(
    private title: Title,
    private meta: Meta,
    private route: ActivatedRoute,
    private jobService: JobsService
  ) {
    this.title.setTitle('Candidate-Job-Detail-View - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Candidate-Job-Detail-View - Flashyre',
      },
    ]);
  }

  ngOnInit(): void {
    this.fetchAllJobs();
  }

  // Lifecycle hook for popup positioning
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.updateFilterPosition();
    }, 100);
  }

  // HostListeners for popup positioning
  @HostListener('window:scroll', ['$event'])
  @HostListener('window:resize', ['$event'])
  onWindowScrollOrResize(): void {
    if (this.showMoreFilters) {
      this.updateFilterPosition();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Core Filtering Logic
  updateFilterPosition(): void {
    if (this.filterIcon && this.filterIcon.nativeElement) {
      const rect = this.filterIcon.nativeElement.getBoundingClientRect();
      this.filterPosition = {
        top: rect.bottom + window.scrollY + 10,
        left: rect.left + window.scrollX + (rect.width / 2) - 450
      };
    }
  }

  openFiltersPopup(initialTab: 'filters' | 'preferences'): void {
    this.initialFilterTab = initialTab;
    this.showMoreFilters = true;
    this.updateFilterPosition();
  }

  private resetMoreFilters(): void {
    this.searchDatePosted = '';
    this.searchExperienceLevel = '';
    this.searchSalary = '';
    this.searchCompanyName = '';
    this.searchWorkMode = '';
    this.searchJobType = '';
    this.searchRole = '';
  }

  onSearch(): void {
    this.resetMoreFilters();
    this.runFilterPipeline();
  }

  onApplyFilters(filters: any): void {
    this.searchDatePosted = filters.datePosted;
    this.searchExperienceLevel = filters.experienceLevel;
    this.searchSalary = filters.salary;
    this.searchLocation = filters.location || this.searchLocation;
    this.searchCompanyName = filters.companyName;
    this.searchWorkMode = filters.workMode;
    this.searchJobType = filters.jobType;
    this.searchRole = filters.role;
    
    this.showMoreFilters = false;
    this.runFilterPipeline();
  }

  private parseFirstNumber(input: string): number | null {
    if (!input || typeof input !== 'string') return null;
    const match = input.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  private runFilterPipeline(): void {
    let sourceList: any[] = [];
    
    // Determine which master list to filter
    switch(this.activeTab) {
      case 'recommended': sourceList = this.masterRecommendedJobs; break;
      case 'saved': sourceList = this.masterSavedJobs; break;
      case 'applied': sourceList = this.masterAppliedJobs; break;
    }
    
    let tempJobs = [...sourceList];

    // Main search bar filters
    const mainKeyword = this.searchJobTitle.toLowerCase().trim();
    if (mainKeyword) {
      tempJobs = tempJobs.filter(job => 
        (job.title || '').toLowerCase().includes(mainKeyword) ||
        (job.description || '').toLowerCase().includes(mainKeyword) ||
        (job.company_name || '').toLowerCase().includes(mainKeyword)
      );
    }

    const mainLocation = this.searchLocation.toLowerCase().trim();
    if (mainLocation) {
      tempJobs = tempJobs.filter(job => (job.location || '').toLowerCase().includes(mainLocation));
    }

    const mainExperience = this.parseFirstNumber(this.searchExperience);
    if (mainExperience !== null) {
        tempJobs = tempJobs.filter(j => 
            j.total_experience_min != null && j.total_experience_max != null &&
            mainExperience >= j.total_experience_min &&
            mainExperience <= j.total_experience_max
        );
    }

    // "More Filters" popup filters
    if (this.searchDatePosted) {
      const now = new Date();
      let cutoffDate = new Date();
      if (this.searchDatePosted === '24h') cutoffDate.setDate(now.getDate() - 1);
      else if (this.searchDatePosted === 'week') cutoffDate.setDate(now.getDate() - 7);
      else if (this.searchDatePosted === 'month') cutoffDate.setMonth(now.getMonth() - 1);
      tempJobs = tempJobs.filter(job => job.created_at && new Date(job.created_at) >= cutoffDate);
    }
    
    const popupExperience = this.parseFirstNumber(this.searchExperienceLevel);
    if (popupExperience !== null) {
        tempJobs = tempJobs.filter(j => 
            j.total_experience_min != null && j.total_experience_max != null &&
            popupExperience >= j.total_experience_min &&
            popupExperience <= j.total_experience_max
        );
    }

    if (this.searchCompanyName && this.searchCompanyName.trim()) {
        const searchCompany = this.searchCompanyName.toLowerCase().trim();
        tempJobs = tempJobs.filter(j => (j.company_name || '').toLowerCase().includes(searchCompany));
    }
    
    const searchSal = this.parseFirstNumber(this.searchSalary);
    if (searchSal !== null) {
        tempJobs = tempJobs.filter(j => 
            j.min_budget != null && j.max_budget != null &&
            searchSal >= j.min_budget && searchSal <= j.max_budget
        );
    }

    if (this.searchWorkMode) {
        tempJobs = tempJobs.filter(j => (j.workplace_type || '').toLowerCase() === this.searchWorkMode.toLowerCase());
    }

    if (this.searchJobType) {
      tempJobs = tempJobs.filter(j => (j.job_type || '').toLowerCase() === this.searchJobType.toLowerCase());
    }

    if (this.searchRole && this.searchRole.trim()) {
      const searchRol = this.searchRole.toLowerCase().trim();
      tempJobs = tempJobs.filter(j => (j.title || '').toLowerCase().includes(searchRol));
    }
    
    // Update the correct filtered list
    switch(this.activeTab) {
      case 'recommended': this.filteredRecommendedJobs = tempJobs; break;
      case 'saved': this.filteredSavedJobs = tempJobs; break;
      case 'applied': this.filteredAppliedJobs = tempJobs; break;
    }
    
    const activeFilter = this.searchJobTitle || this.searchLocation || this.searchExperience || this.searchDatePosted || this.searchExperienceLevel || this.searchSalary || this.searchCompanyName || this.searchWorkMode || this.searchRole || this.searchJobType;
    this.noMatchesFound = tempJobs.length === 0 && !!activeFilter;

    // Refresh the jobs displayed in the UI
    this.updateJobsToDisplay();
  }

  private fetchAllJobs(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      this.errorMessage = "User not found. Please log in again.";
      this.isLoading = false;
      this.masterRecommendedJobs = this.filteredRecommendedJobs = [];
      this.masterSavedJobs = this.filteredSavedJobs = [];
      this.masterAppliedJobs = this.filteredAppliedJobs = [];
      this.updateJobsToDisplay();
      return;
    }

    forkJoin({
      recommended: this.jobService.fetchJobs(),
      saved: this.jobService.fetchSavedJobs(userId),
      applied: this.jobService.fetchAppliedJobDetails()
    }).subscribe({
      next: (results) => {
        // --- NEW FUNCTIONALITY 1: PERSISTENT FILTERING ---
        const savedAndAppliedIds = new Set([
          ...results.saved.map(j => j.job_id),
          ...results.applied.map(j => j.job_id)
        ]);

        const filteredRecommended = results.recommended.filter(job => !savedAndAppliedIds.has(job.job_id));

        // --- NEW FUNCTIONALITY 2: DATE SORTING ---
        // Sort recommended jobs by posted date (descending)
        filteredRecommended.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // Sort saved jobs by saved date (descending) - assuming 'saved_at' property exists
        results.saved.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());
        
        // Sort applied jobs by applied date (descending) - assuming 'applied_at' property exists
        results.applied.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());

        // Populate both master and filtered lists with the processed data
        this.masterRecommendedJobs = this.filteredRecommendedJobs = filteredRecommended;
        this.masterSavedJobs = this.filteredSavedJobs = results.saved;
        this.masterAppliedJobs = this.filteredAppliedJobs = results.applied;
        
        console.log('All jobs fetched, filtered, and sorted successfully:', {
          recommended: this.masterRecommendedJobs.length,
          saved: this.masterSavedJobs.length,
          applied: this.masterAppliedJobs.length
        });

        // Run the filter pipeline to apply any search filters and update the view
        this.runFilterPipeline();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch all jobs:', err);
        this.errorMessage = 'Failed to load job data. Please try again later.';
        this.isLoading = false;
        this.masterRecommendedJobs = this.filteredRecommendedJobs = [];
        this.masterSavedJobs = this.filteredSavedJobs = [];
        this.masterAppliedJobs = this.filteredAppliedJobs = [];
        this.updateJobsToDisplay();
      }
    });
  }

  private setInitialJobSelection(): void {
  const jobIdFromUrl = this.route.snapshot.queryParams['jobId'];
  
  if (jobIdFromUrl) {
    const numericJobId = parseInt(jobIdFromUrl, 10);
    // CORRECTED: 'jobFromUrl' is correctly defined and used here
    const jobFromUrl = this.jobsToDisplay.find(job => job.job_id === numericJobId);
    
    if (jobFromUrl) {
      this.selectedJobId = numericJobId;
      this.selectedJob = jobFromUrl;
      return;
    }
  }
  
  if (this.jobsToDisplay.length > 0) {
    this.selectedJobId = this.jobsToDisplay[0].job_id;
    this.selectedJob = this.jobsToDisplay[0];
  } else {
    this.selectedJobId = null;
    this.selectedJob = null;
  }
}

  // Updates the displayed jobs based on the active tab's filtered list
  private updateJobsToDisplay(): void {
    this.selectedJobId = null; 
    switch (this.activeTab) {
      case 'recommended':
        this.jobsToDisplay = [...this.filteredRecommendedJobs]; 
        break;
      case 'saved':
        this.jobsToDisplay = [...this.filteredSavedJobs];
        break;
      case 'applied':
        this.jobsToDisplay = [...this.filteredAppliedJobs];
        break;
    }
    this.setInitialJobSelection();
  }

  // Runs filter pipeline on tab change
  private selectTab(tab: 'recommended' | 'saved' | 'applied'): void {
    if (this.activeTab !== tab) {
      console.log(`Switching to ${tab} tab`);
      this.activeTab = tab;
      this.runFilterPipeline(); // This will filter the new source and update jobsToDisplay
    }
  }

  selectRecommendedTab(): void { this.selectTab('recommended'); }
  selectSavedTab(): void { this.selectTab('saved'); }
  selectAppliedTab(): void { this.selectTab('applied'); }

  // Event handlers modify the master lists, then re-run filters
  onJobApplied(appliedJob: any): void {
  // Add an application date to the job object for immediate sorting
  appliedJob.applied_at = new Date().toISOString();

  this.masterRecommendedJobs = this.masterRecommendedJobs.filter(j => j.job_id !== appliedJob.job_id);
  this.masterSavedJobs = this.masterSavedJobs.filter(j => j.job_id !== appliedJob.job_id);
  
  // Add to applied list and re-sort
  this.masterAppliedJobs.unshift(appliedJob);
  this.masterAppliedJobs.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
  
  this.runFilterPipeline();
}

  onJobSaved(savedJob: any): void {
  // Add a saved date to the job object for immediate sorting
  savedJob.saved_at = new Date().toISOString();

  this.masterRecommendedJobs = this.masterRecommendedJobs.filter(j => j.job_id !== savedJob.job_id);
  if (!this.masterSavedJobs.some(j => j.job_id === savedJob.job_id)) {
    // Add to saved list and re-sort
    this.masterSavedJobs.unshift(savedJob);
    this.masterSavedJobs.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());
  }
  this.runFilterPipeline();
}

  onJobUnsaved(unsavedJob: any): void {
  this.masterSavedJobs = this.masterSavedJobs.filter(j => j.job_id !== unsavedJob.job_id);
  if (!this.masterRecommendedJobs.some(j => j.job_id === unsavedJob.job_id)) {
    // Add back to recommended list and re-sort
    this.masterRecommendedJobs.unshift(unsavedJob);
    this.masterRecommendedJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  this.runFilterPipeline();
}

  onJobDisliked(dislikedJob: any): void {
    this.masterRecommendedJobs = this.masterRecommendedJobs.filter(j => j.job_id !== dislikedJob.job_id);
    this.masterSavedJobs = this.masterSavedJobs.filter(j => j.job_id !== dislikedJob.job_id);
    this.runFilterPipeline();
  }

  onJobUndisliked(undislikedJob: any): void {
    if (!this.masterRecommendedJobs.some(j => j.job_id === undislikedJob.job_id)) {
      this.masterRecommendedJobs.unshift(undislikedJob);
    }
    this.runFilterPipeline();
  }

  onApplicationRevoked(revokedJobId: number): void {
    const revokedJob = this.masterAppliedJobs.find(job => job.job_id === revokedJobId);
    if (revokedJob) {
      this.masterAppliedJobs = this.masterAppliedJobs.filter(job => job.job_id !== revokedJobId);
      if (!this.masterRecommendedJobs.some(job => job.job_id === revokedJobId)) {
          this.masterRecommendedJobs.unshift(revokedJob);
      }
    }
    this.runFilterPipeline();
  }

  // Getters for counts now use the filtered lists to reflect the UI
  get recommendedJobCount(): number | null {
    return this.filteredRecommendedJobs?.length ?? null;
  }
  get savedJobCount(): number | null {
    return this.filteredSavedJobs?.length ?? null;
  }
  get appliedJobCount(): number | null {
    return this.filteredAppliedJobs?.length ?? null;
  }
  
  onJobSelected(job: any): void {
    this.selectedJobId = job?.job_id ?? null;
    this.selectedJob = job;
  }
}