// recruiter-view-3rd-page1.component.ts

import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RecruiterDataService, JobPost } from '../../services/recruiter-data.service';

import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { CandidatePreferenceService } from '../../services/candidate-preference.service'; // <-- Import the original service
import { RecruiterPreferenceService } from '../../services/recruiter-preference.service'; 

import { CorporateAuthService } from 'src/app/services/corporate-auth.service';
import { environment } from 'src/environments/environment';
import { JobCreationWorkflowService } from 'src/app/services/job-creation-workflow.service';



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
  recruiterProfile: any = {};
  defaultProfilePicture: string = environment.defaultProfilePicture;
  chcsThumbnailIcon: string = environment.chcs_logo_thumbnail;
  
  masterPostedJobs: JobPost[] = [];
  filteredJobs: JobPost[] = [];
  postedJobs: JobPost[] = [];

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
  private displayPage = 0;
  private jobsPerPage = 10;
  isLoading = true;
  allJobsDisplayed = false;

  activeTab: 'live' | 'draft-pause' | 'deleted' = 'live';

  constructor(
    private title: Title,
    private meta: Meta,
    private recruiterService: RecruiterDataService,
    private router: Router,
    private workflowService: JobCreationWorkflowService,
    private corporateAuthService: CorporateAuthService,
    private recruiterPreferenceService: RecruiterPreferenceService,
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
    if (typeof window !== 'undefined' && window.localStorage) {
      this.loadUserProfile();
      this.recruiterId = localStorage.getItem('user_id');
    }

    if (this.recruiterId) {
      this.fetchAllJobs();
    } else {
      console.error('Recruiter ID not found in local storage.');
    }
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) 
      this.recruiterProfile = JSON.parse(profileData);
  }

  fetchAllJobs(apiPage = 1): void {
    if (apiPage === 1) {
      this.isLoading = true;
      this.masterPostedJobs = [];
    }

    this.recruiterService.getRecruiterJobs(this.recruiterId, apiPage).subscribe(
      (data) => {
        if (data.jobs && data.jobs.length > 0) {
          this.masterPostedJobs.push(...data.jobs);
          this.fetchAllJobs(apiPage + 1);
        } else {
          this.isLoading = false;
          this.runFilterPipeline();
        }
      },
      (error) => {
        console.error(`Error fetching page ${apiPage} of posted jobs:`, error);
        this.isLoading = false;
        this.runFilterPipeline();
      }
    );
  }

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

    
    switch (this.activeTab) {
      case 'live':
        tempJobs = tempJobs.filter(job => job.status === 'final');
        break;
      case 'draft-pause':
        tempJobs = tempJobs.filter(job => job.status === 'draft' || job.status === 'pause');
        break;
      case 'deleted':
        tempJobs = tempJobs.filter(job => job.status === 'deleted');
        break;
    }

    const keywordTerm = this.searchJobTitle.toLowerCase().trim();
    const locationTerm = this.searchLocation.toLowerCase().trim();
    const experienceTerm = this.searchExperience.toLowerCase().trim();

    // --- Combine Main Search Bars AND "More Filters" Popup values ---
    const keyword = this.searchJobTitle.toLowerCase().trim();
    const location = (this.searchLocation || '').toLowerCase().trim();
    const experience = this.searchExperience || this.searchExperienceLevel; // Use main bar or popup

    // --- Apply Filters ---

    // Keyword Filter (from main search bar)
    if (keyword) {
      tempJobs = tempJobs.filter(job =>
        (job.role || '').toLowerCase().includes(keyword) ||
        (job.description || '').toLowerCase().includes(keyword)
      );
    }

    // Location Filter (from main search bar OR popup)
    if (location) {
      tempJobs = tempJobs.filter(job => (job.location || '').toLowerCase().includes(location));
    }

    // Experience Filter (from main search bar OR popup)
    if (experience && experience.trim()) {
      const searchExp = this.parseFirstNumber(experience);
      if (searchExp !== null) {
        tempJobs = tempJobs.filter(j => 
          j.total_experience_min != null && j.total_experience_max != null &&
          searchExp >= j.total_experience_min && searchExp <= j.total_experience_max
        );
      }
    }

    // Company Name Filter (from popup)
    if (this.searchCompanyName && this.searchCompanyName.trim()) {
        const searchCompany = this.searchCompanyName.toLowerCase().trim();
        tempJobs = tempJobs.filter(j => (j.company_name || '').toLowerCase().includes(searchCompany));
    }
    
    // Job Type Filter (from popup)
    if (this.searchJobType) {
        tempJobs = tempJobs.filter(j => (j.job_type || '').toLowerCase() === this.searchJobType.toLowerCase());
    }

    // Salary Filter (from popup)
    if (this.searchSalary && this.searchSalary.trim()) {
      const searchSal = this.parseFirstNumber(this.searchSalary);
      if (searchSal !== null) {
        tempJobs = tempJobs.filter(j => 
          j.min_budget != null && j.max_budget != null &&
          searchSal >= j.min_budget && searchSal <= j.max_budget
        );
      }
    }

    // --- Finalize and Update UI ---
    this.filteredJobs = tempJobs;
    this.displayPage = 0;
    this.postedJobs = [];
    this.allJobsDisplayed = false;
    this.loadNextPage();
  }



  onSavePreference(filters: any): void {
    // Here you would call your recruiter preference service
    // This assumes your recruiter preference service has a 'savePreference' method
    this.recruiterPreferenceService.savePreference(filters).subscribe({
      next: (response) => {
        console.log('Recruiter preference saved successfully!', response);
        alert('Preference saved!');
        // Optionally, switch to the preferences tab
        this.initialFilterTab = 'preferences';
      },
      error: (error) => {
        console.error('Error saving recruiter preference:', error);
        alert('Failed to save preference. Please try again.');
      }
    });
  }

  private parseFirstNumber(input: string): number | null {
    if (!input || typeof input !== 'string') {
      return null;
    }
    // This regex finds the first sequence of digits in a string.
    const match = input.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  private parseNumericFilter(input: string): number | null {
    if (!input || typeof input !== 'string') {
      return null;
    }
    // Extracts the first sequence of digits from the string.
    const match = input.match(/\d+/);
    if (match) {
      return parseInt(match[0], 10);
    }
    return null;
  }

  private parseNumbersFromString(input: string): number[] {
    if (!input || typeof input !== 'string') {
      return [];
    }
    // This regex finds all sequences of digits in a string.
    const matches = input.match(/\d+/g);
    return matches ? matches.map(num => parseInt(num, 10)) : [];
  }

  /**
   * Loads the next set of jobs from the filtered list into the displayed list.
   */
  private loadNextPage(): void {
    if (this.isLoading || this.allJobsDisplayed) return;
    const startIndex = this.displayPage * this.jobsPerPage;
    if (startIndex >= this.filteredJobs.length) {
      this.allJobsDisplayed = true;
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
  
  selectTab(tabName: 'live' | 'draft-pause' | 'deleted'): void {
    this.activeTab = tabName;
    this.runFilterPipeline();
  }

  // --- ADD THIS FUNCTION ---
  /**
   * Calculates the number of jobs with a given status from the master list.
   * @param status The status to count.
   * @returns The number of jobs matching the status.
   */
  getStatusCount(status: 'final' | 'draft' | 'pause' | 'deleted'): number {
    if (!this.masterPostedJobs) {
      return 0;
    }
    return this.masterPostedJobs.filter(job => job.status === status).length;
  }
  // --- END OF ADDED FUNCTION ---

  handleStatusChange(job: JobPost, newStatus: 'pause' | 'final' | 'deleted', event: Event): void {
    let confirmationMessage = '';
    if (newStatus === 'pause') {
      confirmationMessage = 'Are you sure you want to pause this job?';
    } else if (newStatus === 'final') {
      confirmationMessage = 'Are you sure you want to make this job live?';
    } else if (newStatus === 'deleted') {
      confirmationMessage = 'Are you sure you want to delete this job?';
    }

    if (confirm(confirmationMessage)) {
      this.recruiterService.updateJobStatus(job.unique_id, newStatus).subscribe({
        next: () => {
          const jobInMaster = this.masterPostedJobs.find(j => j.unique_id === job.unique_id);
          if (jobInMaster) {
            jobInMaster.status = newStatus;
          }
          this.runFilterPipeline();
        },
        error: (err) => console.error('Failed to update job status:', err)
      });
    } else {
        // If user clicks "Cancel", prevent the default action and revert the checkbox state
        event.preventDefault();
        const input = event.target as HTMLInputElement;
        input.checked = !input.checked;
    }
  }
  
  editJob(job: JobPost): void {
    // 3. MODIFY THIS METHOD
    // This starts the edit workflow and stores the job ID and edit flag
    this.workflowService.startEditWorkflow(job.unique_id);
    // This navigation is now more powerful because the workflow service holds the state
    this.router.navigate(['/create-job-post-1st-page', job.unique_id]);
  }

  getPostedDaysAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const differenceInTime = now.getTime() - date.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

    if (differenceInDays === 0) {
        return 'today';
    } else if (differenceInDays === 1) {
        return '1 day ago';
    } else {
        return `${differenceInDays} days ago`;
    }
  }

  getDisplayDate(job: JobPost): string {
    if (this.activeTab === 'draft-pause' || this.activeTab === 'deleted') {
      return `Updated ${this.getPostedDaysAgo(job.updated_at || job.created_at)}`;
    }
    return `Posted ${this.getPostedDaysAgo(job.created_at)}`;
  }

  navigateToCreateJobPost(): void {
    this.router.navigate(['/create-job-post-1st-page']);
  }

  viewJobApplications(jobId: string | number): void { // Can be string or number
    if (jobId) {
      this.router.navigate(['/recruiter-view-job-applications-1', jobId]);
    } else {
      console.error('Job ID is missing, cannot navigate.');
    }
  }

  onLogoutClick() {
    this.corporateAuthService.logout();
  }
}