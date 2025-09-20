// recruiter-view-3rd-page1.component.ts

import { Component, OnInit, HostListener } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RecruiterDataService, RecruiterProfile, JobPost } from '../../services/recruiter-data.service';

@Component({
  selector: 'recruiter-view3rd-page1',
  templateUrl: 'recruiter-view-3rd-page1.component.html',
  styleUrls: ['recruiter-view-3rd-page1.component.css'],
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
    this.runFilterPipeline();
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

    // Filter by Job Title/Keyword
    if (keywordTerm) {
      tempJobs = tempJobs.filter(job => 
        (job.job_role || '').toLowerCase().includes(keywordTerm)
      );
    }

    // Filter by Location
    if (locationTerm) {
      tempJobs = tempJobs.filter(job =>
        (job.experience_location || '').toLowerCase().includes(locationTerm)
      );
    }
    
    // Filter by Experience
    if (experienceTerm) {
      tempJobs = tempJobs.filter(job =>
        (job.experience_location || '').toLowerCase().includes(experienceTerm)
      );
    }

    // Update the lists for display
    this.filteredJobs = tempJobs;
    this.displayPage = 0; // Reset the display page counter
    this.postedJobs = []; // Clear the currently displayed jobs
    this.allJobsDisplayed = false; // Reset the display status
    this.loadNextPage(); // Load the first page of filtered results
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