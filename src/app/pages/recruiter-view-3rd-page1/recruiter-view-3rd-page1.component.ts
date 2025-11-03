// src/app/pages/recruiter-view-3rd-page1/recruiter-view-3rd-page1.component.ts

import { Component, OnInit, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RecruiterDataService, JobPost } from '../../services/recruiter-data.service';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { CandidatePreferenceService } from '../../services/candidate-preference.service';
import { RecruiterPreferenceService } from '../../services/recruiter-preference.service';
import { CorporateAuthService } from 'src/app/services/corporate-auth.service';
import { environment } from 'src/environments/environment';
import { JobCreationWorkflowService } from 'src/app/services/job-creation-workflow.service';
import { AdminJobCreationWorkflowService } from 'src/app/services/admin-job-creation-workflow.service';
// Define the type for job statuses
type JobStatus = 'final' | 'draft' | 'pause' | 'deleted';

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
    { provide: CandidatePreferenceService, useClass: RecruiterPreferenceService }
  ]
})
export class RecruiterView3rdPage1 implements OnInit, AfterViewInit {
  public isAdmin: boolean = false;

  recruiterProfile: any = {};
  defaultProfilePicture: string = environment.defaultProfilePicture;
  chcsThumbnailIcon: string = environment.chcs_logo_thumbnail;

  // Data lists
  masterPostedJobs: JobPost[] = [];
  filteredJobs: JobPost[] = [];
  postedJobs: JobPost[] = [];

  // Alert and Popup state
  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];
  showPopup: boolean = false;
  popupMessage: string = '';
  popupType: 'success' | 'error' = 'success';

  // Main search bar filter models
  searchJobTitle: string = '';
  searchLocation: string = '';
  searchExperience: string = '';

  // "More Filters" popup models
  searchDatePosted: string = '';
  searchExperienceLevel: string = '';
  searchDepartment: string = '';
  searchSalary: string = '';
  searchCompanyName: string = '';
  searchIndustries: string = '';
  searchWorkMode: string = '';
  searchRole: string = '';
  searchJobType: string = '';

  // UI State for Filter Popup (Declared only ONCE)
  showMoreFilters: boolean = false;
  initialFilterTab: 'filters' | 'preferences' = 'filters';
  @ViewChild('filterIcon', { static: false }) filterIcon!: ElementRef;
  filterPosition = { top: 0, left: 0 };

  // General State management
  recruiterId: string | null = null;
  userType: string | null = null;
  private displayPage = 0;
  private jobsPerPage = 10;
  isLoading = true;
  allJobsDisplayed = false;
  private actionContext: { action: string, job?: JobPost, newStatus?: JobStatus, event?: Event } | null = null;
  activeTab: 'live' | 'draft-pause' | 'deleted' = 'live';

  constructor(
    private title: Title,
    private meta: Meta,
    private recruiterService: RecruiterDataService,
    private router: Router,
    private workflowService: JobCreationWorkflowService,
    private adminWorkflowService: AdminJobCreationWorkflowService,
    private corporateAuthService: CorporateAuthService,
    private recruiterPreferenceService: RecruiterPreferenceService,
  ) {
    this.title.setTitle('Recruiter-View-3rd-Page1 - Flashyre');
    this.meta.addTags([
        { property: 'og:title', content: 'Recruiter-View-3rd-Page1 - Flashyre' },
    ]);
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.loadUserProfile();

      // <<< MODIFICATION START: Check user role from the loaded profile
      // This assumes the user's role is stored in the profile object.
      this.userType = localStorage.getItem('userType')
      if (this.userType === 'admin') {
          this.isAdmin = true;
      }

      this.recruiterId = localStorage.getItem('user_id');
    }
    if (this.recruiterId) {
      this.fetchAllJobs();
    } else {
      console.error('Recruiter ID not found in local storage.');
      this.isLoading = false;
    }
    this.recruiterPreferenceService.setActiveTab(this.activeTab);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.updateFilterPosition();
    }, 100);
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

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) this.recruiterProfile = JSON.parse(profileData);
  }

   isImage(src: string): boolean {
    // This function checks if the source string is a valid URL for an image.
    if (!src) {
      return false;
    }
    return src.startsWith('http') || src.startsWith('data:image');
  }

  selectTab(tabName: 'live' | 'draft-pause' | 'deleted'): void {
    this.activeTab = tabName;
    console.log("[IN REC PAGE - select Tab]current tab: ",this.activeTab);
    this.recruiterPreferenceService.setActiveTab(tabName);
    this.runFilterPipeline();
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

  private runFilterPipeline(): void {
    let tempJobs = [...this.masterPostedJobs];

    // Filter by Active Tab first
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

    // Filter by Job Title/Keyword
    const mainKeyword = this.searchJobTitle.toLowerCase().trim();
    if (mainKeyword) {
        tempJobs = tempJobs.filter(job => 
            (job.role || '').toLowerCase().includes(mainKeyword) || // CHANGED: from 'job_role' to 'role'
            (job.description || '').toLowerCase().includes(mainKeyword) ||
            (job.company_name || '').toLowerCase().includes(mainKeyword)
        );
    }

    // Filter by Location
    const mainLocation = this.searchLocation.toLowerCase().trim();
    if (mainLocation) {
        tempJobs = tempJobs.filter(job => (job.location || '').toLowerCase().includes(mainLocation));
    }
    

    // Filter by Experience (from main search bar)
    const mainExperience = this.parseFirstNumber(this.searchExperience);
    if (mainExperience !== null) {
        tempJobs = tempJobs.filter(j => 
            j.total_experience_min != null && j.total_experience_max != null &&
            mainExperience >= j.total_experience_min &&
            mainExperience <= j.total_experience_max
        );
    }

    // --- "More Filters" Popup Logic ---

    // Filter by Date Posted
    if (this.searchDatePosted) {
        const now = new Date();
        let cutoffDate = new Date();
        if (this.searchDatePosted === '24h') cutoffDate.setDate(now.getDate() - 1);
        else if (this.searchDatePosted === 'week') cutoffDate.setDate(now.getDate() - 7);
        else if (this.searchDatePosted === 'month') cutoffDate.setMonth(now.getMonth() - 1);
        
        tempJobs = tempJobs.filter(job => job.created_at && new Date(job.created_at) >= cutoffDate);
    }

    // Filter by Experience (from popup)
    const popupExperience = this.parseFirstNumber(this.searchExperienceLevel);
    if (popupExperience !== null) {
        tempJobs = tempJobs.filter(j => 
            j.total_experience_min != null && j.total_experience_max != null &&
            popupExperience >= j.total_experience_min &&
            popupExperience <= j.total_experience_max
        );
    }
    
    // Filter by Job Type
    if (this.searchJobType) {
        tempJobs = tempJobs.filter(j => (j.job_type || '').toLowerCase() === this.searchJobType.toLowerCase());
    }

    // Filter by Role
    if (this.searchRole && this.searchRole.trim()) {
        const searchRol = this.searchRole.toLowerCase().trim();
        tempJobs = tempJobs.filter(j => (j.role || '').toLowerCase().includes(searchRol)); // CHANGED: from 'job_role' to 'role'
    }
    
    // Filter by Company Name
    if (this.searchCompanyName && this.searchCompanyName.trim()) {
        const searchCompany = this.searchCompanyName.toLowerCase().trim();
        tempJobs = tempJobs.filter(j => (j.company_name || '').toLowerCase().includes(searchCompany));
    }
    
    // Filter by Salary
    const searchSal = this.parseFirstNumber(this.searchSalary);
    if (searchSal !== null) {
        tempJobs = tempJobs.filter(j => 
            j.min_budget != null && j.max_budget != null &&
            searchSal >= j.min_budget && searchSal <= j.max_budget
        );
    }

    // Filter by Work Mode
    if (this.searchWorkMode) {
        // CHANGED: from 'work_mode' to 'workplace_type' to match backend model
        tempJobs = tempJobs.filter(j => (j.workplace_type || '').toLowerCase() === this.searchWorkMode.toLowerCase());
    }

    // Finalize and update UI
    this.filteredJobs = tempJobs;
    this.displayPage = 0;
    this.postedJobs = [];
    this.allJobsDisplayed = false;
    this.loadNextPage();
  }
  
  onSavePreference(filters: any): void {
    console.log("[IN SAVE PREFERENCE] activeTab: ", this.activeTab);
    this.recruiterPreferenceService.savePreference(filters, this.activeTab).subscribe({
      next: (response) => {
        console.log('Recruiter preference saved successfully!', response);
        this.showSuccessPopup('Preference saved!');
        this.initialFilterTab = 'preferences'; 
        this.showMoreFilters = false; 
        setTimeout(() => this.openFiltersPopup('preferences'), 10);
      },
      error: (error) => {
        console.error('Error saving recruiter preference:', error);
        this.showErrorPopup(error.error?.detail || 'Failed to save preference.');
      }
    });
  }

  private parseFirstNumber(input: string): number | null {
    if (!input || typeof input !== 'string') return null;
    const match = input.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }
  
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
    if (pos >= max - 100) { this.loadNextPage(); }
    if (this.showMoreFilters) { this.updateFilterPosition(); }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(): void {
    if (this.showMoreFilters) { this.updateFilterPosition(); }
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

  getStatusCount(status: 'final' | 'draft' | 'pause' | 'deleted'): number {
    if (!this.masterPostedJobs) return 0;
    if (status === 'final') return this.masterPostedJobs.filter(job => job.status === 'final').length;
    if (status === 'draft') return this.masterPostedJobs.filter(job => job.status === 'draft').length;
    if (status === 'pause') return this.masterPostedJobs.filter(job => job.status === 'pause').length;
    if (status === 'deleted') return this.masterPostedJobs.filter(job => job.status === 'deleted').length;
    return 0;
  }

  handleStatusChangeConfirmed(job: JobPost, newStatus: JobStatus, event: Event): void {
    this.recruiterService.updateJobStatus(job.unique_id, newStatus).subscribe({
        next: () => {
            const jobInMaster = this.masterPostedJobs.find(j => j.unique_id === job.unique_id);
            if (jobInMaster) {
                jobInMaster.status = newStatus as 'pause' | 'final' | 'deleted';
            }
            this.runFilterPipeline();
            this.showSuccessPopup('Job status updated successfully!');
        },
        error: (err) => {
            console.error('Failed to update job status:', err);
            this.showErrorPopup('Failed to update job status.');
            if (event) {
                const input = event.target as HTMLInputElement;
                input.checked = !input.checked;
            }
        }
    });
  }

  editJob(job: JobPost): void {
    this.adminWorkflowService.startEditWorkflow(job.unique_id);
    this.router.navigate(['/admin-create-job-step1', job.unique_id]);
  }

  getPostedDaysAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const differenceInTime = now.getTime() - date.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
    if (differenceInDays === 0) return 'today';
    if (differenceInDays === 1) return '1 day ago';
    return `${differenceInDays} days ago`;
  }

  getDisplayDate(job: JobPost): string {
    if (this.activeTab === 'draft-pause' || this.activeTab === 'deleted') {
      return `Updated ${this.getPostedDaysAgo(job.updated_at || job.created_at)}`;
    }
    return `Posted ${this.getPostedDaysAgo(job.created_at)}`;
  }

  navigateToCreateJobPost(): void {
    this.router.navigate(['/admin-create-job-step1']);
  }

  public viewJobDescription(job: JobPost): void {
    if (job && job.job_description_url) {
      // Open the URL in a new browser tab
      window.open(job.job_description_url, '_blank');
    } else {
      // Fallback in case the function is called on a job without a URL
      console.warn('Attempted to view a job description, but no URL was found.', job);
      this.showErrorPopup('No job description document is attached to this post.');
    }
  }


  viewJobApplications(jobId: string | number): void {
    if (jobId) {
      this.router.navigate(['/recruiter-view-job-applications-1', jobId]);
    } else {
      console.error('Job ID is missing, cannot navigate.');
    }
  }

  onLogoutClick() {
    this.corporateAuthService.logout();
  }

  showSuccessPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'success';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 3000);
  }

  showErrorPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'error';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 5000);
  }

  closePopup() {
    this.showPopup = false;
  }

  private openAlert(message: string, buttons: string[]) {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.showAlert = true;
  }

  onAlertButtonClicked(action: string) {
    this.showAlert = false;
    const context = this.actionContext;
    if (!context) return;
    const confirmedAction = action.toLowerCase() !== 'no' && action.toLowerCase() !== 'cancel';
    if (confirmedAction) {
      switch (context.action) {
        case 'changeStatus':
          this.handleStatusChangeConfirmed(context.job!, context.newStatus!, context.event!);
          break;
        case 'delete':
          this.handleStatusChangeConfirmed(context.job!, 'deleted', context.event!);
          break;
      }
    } else {
      if (context.action === 'changeStatus' && context.event) {
          const input = context.event.target as HTMLInputElement;
          input.checked = !input.checked;
      }
    }
    this.actionContext = null;
  }

  onStatusChangeAttempt(job: JobPost, event: Event) {
    event.preventDefault();
    const newStatus: JobStatus = job.status === 'final' ? 'pause' : 'final';
    const message = newStatus === 'pause' 
      ? 'Are you sure you want to pause this job?' 
      : 'Are you sure you want to make this job live?';
    this.actionContext = { action: 'changeStatus', job, newStatus, event };
    this.openAlert(message, ['No', 'Yes']);
  }

  onDeleteAttempt(job: JobPost, event: Event) {
    this.actionContext = { action: 'delete', job, event };
    this.openAlert('Are you sure you want to delete this job?', ['Cancel', 'Delete']);
  }
}