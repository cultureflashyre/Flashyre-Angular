// recruiter-view-3rd-page1.component.ts

import { Component, OnInit, HostListener } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
// MODIFIED: Make sure JobPost is imported from the correct service
import { RecruiterDataService, JobPost } from '../../services/recruiter-data.service';
import { CorporateAuthService } from 'src/app/services/corporate-auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'recruiter-view3rd-page1',
  templateUrl: 'recruiter-view-3rd-page1.component.html',
  styleUrls: ['recruiter-view-3rd-page1.component.css'],
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
    private corporateAuthService: CorporateAuthService,
  ) {
    this.title.setTitle('Recruiter-View-3rd-Page1 - Flashyre');
    this.meta.addTags([
      // ... your meta tags
    ]);
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
    this.runFilterPipeline();
  }

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

    if (keywordTerm) {
      tempJobs = tempJobs.filter(job => 
        (job.job_role || '').toLowerCase().includes(keywordTerm)
      );
    }
    if (locationTerm) {
      tempJobs = tempJobs.filter(job =>
        (job.experience_location || '').toLowerCase().includes(locationTerm)
      );
    }
    if (experienceTerm) {
      tempJobs = tempJobs.filter(job =>
        (job.experience_location || '').toLowerCase().includes(experienceTerm)
      );
    }

    this.filteredJobs = tempJobs;
    this.displayPage = 0;
    this.postedJobs = [];
    this.allJobsDisplayed = false;
    this.loadNextPage();
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
    if (pos >= max - 100) {
      this.loadNextPage();
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

  handleStatusChange(job: JobPost, newStatus: 'pause' | 'final' | 'deleted'): void {
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
    }
  }
  
  editJob(job: JobPost): void {
    this.router.navigate(['/create-job-post-1st-page', job.unique_id]);
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