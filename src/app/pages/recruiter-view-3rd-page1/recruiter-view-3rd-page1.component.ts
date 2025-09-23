// recruiter-view-3rd-page1.component.ts

import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RecruiterDataService, RecruiterProfile, JobPost } from '../../services/recruiter-data.service';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { CandidatePreferenceService } from '../../services/candidate-preference.service'; // <-- Import the original service
import { RecruiterPreferenceService } from '../../services/recruiter-preference.service'; 

@Component({
  selector: 'recruiter-view3rd-page1',
  templateUrl: 'recruiter-view-3rd-page1.component.html',
  styleUrls: ['recruiter-view-3rd-page1.component.css'],
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
  ],
  providers: [
    // This tells Angular: When a child component (like morefilterscomponent1)
    // asks for CandidatePreferenceService, give it RecruiterPreferenceService instead.
    { provide: CandidatePreferenceService, useClass: RecruiterPreferenceService }
  ]
})

export class RecruiterView3rdPage1 implements OnInit {
  recruiterProfile: RecruiterProfile | null = null;
  
  // Job list management
  masterPostedJobs: JobPost[] = []; // Holds all jobs from the API, never modified by filters
  filteredJobs: JobPost[] = []; // Holds jobs after filtering
  postedJobs: JobPost[] = []; // Holds the jobs currently displayed on the page

  // Search bar models
  searchJobTitle: string = '';
  searchLocation: string = '';
  searchExperience: string = '';

  // --- "More Filters" popup models (New) ---
  searchDatePosted: string = '';
  searchExperienceLevel: string = '';
  searchDepartment: string = '';
  searchSalary: string = '';
  searchCompanyName: string = '';
  searchIndustries: string = '';
  searchWorkMode: string = '';
  searchRole: string = '';
  searchJobType: string = '';
  
  // --- UI State (New) ---
  showMoreFilters: boolean = false;
  initialFilterTab: 'filters' | 'preferences' = 'filters';
  @ViewChild('filterIcon', { static: false }) filterIcon!: ElementRef;
  filterPosition = { top: 0, left: 0 };


  // State management
  recruiterId: string | null = null;
  private displayPage = 0; // Tracks the current page of DISPLAYED jobs
  private jobsPerPage = 10; // How many jobs to display at a time
  isLoading = true; // For initial load
  allJobsDisplayed = false; // Tracks if all FILTERED jobs are displayed

  constructor(
    private title: Title,
    private meta: Meta,
    private recruiterService: RecruiterDataService,
    private router: Router
  ) {
    this.title.setTitle('Recruiter-View-3rd-Page1 - Flashyre');
    this.meta.addTags([
      // ... your meta tags
    ]);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.updateFilterPosition();
    }, 100);
  }

  ngOnInit(): void {
  // Check if running in a browser environment before accessing localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    this.recruiterId = localStorage.getItem('user_id');
  }

  if (this.recruiterId) {
    this.fetchRecruiterProfile();
    this.fetchAllJobs(); // Start fetching all jobs page by page
  } else {
    console.error('Recruiter ID not found in local storage. User might not be logged in.');
    // Optionally, you can redirect the user to the login page
    // this.router.navigate(['/login']);
  }
}

  fetchRecruiterProfile(): void {
    this.recruiterService.getRecruiterProfile(this.recruiterId).subscribe(
      (data) => {
        this.recruiterProfile = data;
      },
      (error) => {
        console.error('Error fetching recruiter profile:', error);
      }
    );
  }

  /**
   * Fetches all posted jobs by calling the paginated API endpoint recursively.
   * This is the corrected data loading logic.
   * @param apiPage The page number to fetch from the API.
   */
  fetchAllJobs(apiPage = 1): void {
    // Show loader only on the first call
    if (apiPage === 1) {
      this.isLoading = true;
      this.masterPostedJobs = [];
    }

    // Call the service with the correct two arguments
    this.recruiterService.getRecruiterJobs(this.recruiterId, apiPage).subscribe(
      (data) => {
        if (data.jobs && data.jobs.length > 0) {
          // Add the fetched jobs to our master list
          this.masterPostedJobs.push(...data.jobs);
          // Recursively call to fetch the next page
          this.fetchAllJobs(apiPage + 1);
        } else {
          // No more jobs were returned, so we're done fetching from the API.
          this.isLoading = false;
          // Now, display the initial set of jobs based on current (empty) filters.
          this.runFilterPipeline();
        }
      },
      (error) => {
        console.error(`Error fetching page ${apiPage} of posted jobs:`, error);
        this.isLoading = false;
        // In case of an error, still try to display whatever jobs were fetched successfully.
        this.runFilterPipeline();
      }
    );
  }

  /**
   * Main search button click handler
   */
  onSearch(): void {
    this.resetMoreFilters();
    this.runFilterPipeline();
  }

  onApplyFilters(filters: any): void {
    this.searchDatePosted = filters.datePosted;
    this.searchExperienceLevel = filters.experienceLevel;
    this.searchDepartment = filters.department;
    this.searchSalary = filters.salary;
    this.searchLocation = filters.location || this.searchLocation;
    this.searchCompanyName = filters.companyName;
    this.searchIndustries = filters.industries;
    this.searchWorkMode = filters.workMode;
    this.searchRole = filters.role;
    this.searchJobType = filters.jobType;
    
    this.showMoreFilters = false;
    this.runFilterPipeline();
  }

  private resetMoreFilters(): void {
    this.searchDatePosted = '';
    this.searchExperienceLevel = '';
    this.searchDepartment = '';
    this.searchSalary = '';
    this.searchCompanyName = '';
    this.searchIndustries = '';
    this.searchWorkMode = '';
    this.searchRole = '';
    this.searchJobType = '';
  }

  /**
   * The core filtering logic. It filters the master list of jobs
   * and resets the view with the results.
   */
  private runFilterPipeline(): void {
    let tempJobs = [...this.masterPostedJobs];
    const keywordTerm = this.searchJobTitle.toLowerCase().trim();
    const locationTerm = this.searchLocation.toLowerCase().trim();
    const experienceTerm = this.searchExperience.toLowerCase().trim();

    if (keywordTerm) {
      tempJobs = tempJobs.filter(job =>
        (job.job_role || '').toLowerCase().includes(keywordTerm) ||
        (job.description || '').toLowerCase().includes(keywordTerm) ||
        (job.requirements || '').toLowerCase().includes(keywordTerm) ||
        (job.company_name || '').toLowerCase().includes(keywordTerm) ||
        (job.job_type || '').toLowerCase().includes(keywordTerm)
      );
    }

    if (locationTerm) {
      tempJobs = tempJobs.filter(job =>
        (job.location || '').toLowerCase().includes(locationTerm)
      );
    }
    
    if (experienceTerm) {
        const searchExp = parseInt(experienceTerm, 10);
        if (!isNaN(searchExp)) {
            tempJobs = tempJobs.filter(job => job.experience_required != null && job.experience_required >= searchExp);
        }
    }

    // --- Add "More Filters" logic below ---
    if (this.searchDatePosted) {
      const now = new Date();
      let cutoff: Date;
      if (this.searchDatePosted === '24h') { cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); } 
      else if (this.searchDatePosted === 'week') { cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); } 
      else if (this.searchDatePosted === 'month') { cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); } 
      else { cutoff = new Date(0); }
      tempJobs = tempJobs.filter(job => new Date(job.created_at) > cutoff);
    }
    
    // **FIXED**: The 'experience_level' filter now uses 'experience_required' with an assumed mapping.
    if (this.searchExperienceLevel) { 
        tempJobs = tempJobs.filter(j => {
            const exp = j.experience_required;
            if (exp == null) return false;
            switch (this.searchExperienceLevel.toLowerCase()) {
                case 'entry': return exp >= 0 && exp <= 2;
                case 'mid': return exp >= 3 && exp <= 7;
                case 'senior': return exp >= 8;
                default: return false;
            }
        });
    }

    // **NOTE**: The following properties do not exist on JobPost and have been removed from the filter logic:
    // - department
    // - salary_range
    // - industries
    // - work_mode

    if (this.searchCompanyName) { tempJobs = tempJobs.filter(j => (j.company_name || '').toLowerCase().includes(this.searchCompanyName.toLowerCase().trim())); }
    if (this.searchRole) { tempJobs = tempJobs.filter(j => (j.job_role || '').toLowerCase().includes(this.searchRole.toLowerCase())); }
    if (this.searchJobType) { tempJobs = tempJobs.filter(j => (j.job_type || '').toLowerCase() === this.searchJobType.toLowerCase()); }

    this.filteredJobs = tempJobs;
    this.displayPage = 0;
    this.postedJobs = [];
    this.allJobsDisplayed = false;
    this.loadNextPage();
  }

  /**
   * Loads the next set of jobs from the filtered list into the displayed list.
   */
  private loadNextPage(): void {
    if (this.isLoading || this.allJobsDisplayed) {
      return;
    }

    const startIndex = this.displayPage * this.jobsPerPage;
    if (startIndex >= this.filteredJobs.length) {
      this.allJobsDisplayed = true; // All filtered jobs have been loaded
      return;
    }

    const endIndex = startIndex + this.jobsPerPage;
    const nextJobs = this.filteredJobs.slice(startIndex, endIndex);
    
    this.postedJobs.push(...nextJobs);
    this.displayPage++;
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event): void {
    const pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
    const max = document.documentElement.scrollHeight;
    
    // Load more jobs for display when the user is 100px from the bottom
    if (pos >= max - 100) {
      this.loadNextPage();
    }
    if (this.showMoreFilters) {
      this.updateFilterPosition();
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(): void {
    if (this.showMoreFilters) {
      this.updateFilterPosition();
    }
  }

  openFiltersPopup(initialTab: 'filters' | 'preferences'): void {
    this.initialFilterTab = initialTab;
    this.showMoreFilters = true;
    this.updateFilterPosition();
  }

  updateFilterPosition(): void {
    if (this.filterIcon && this.filterIcon.nativeElement) {
      const rect = this.filterIcon.nativeElement.getBoundingClientRect();
      this.filterPosition = {
        top: rect.bottom + window.scrollY + 10,
        left: rect.left + window.scrollX + (rect.width / 2) - 450
      };
    }
  }

  getPostedDaysAgo(createdAt: string): string {
    const createdDate = new Date(createdAt);
    const currentDate = new Date();
    const differenceInTime = currentDate.getTime() - createdDate.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

    if (differenceInDays === 0) {
      return 'job posted today';
    } else if (differenceInDays === 1) {
      return 'job posted 1 day ago';
    } else {
      return `job posted ${differenceInDays} days ago`;
    }
  }

  navigateToCreateJobPost(): void {
    this.router.navigate(['/create-job-post-1st-page']);
  }

  viewJobApplications(jobId: string): void {
    if (jobId) {
      this.router.navigate(['/recruiter-view-job-applications-1', jobId]);
    } else {
      console.error('Job ID is missing, cannot navigate.');
    }
  }
}