import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

import { AuthService } from '../../services/candidate.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

// --- ADDED: Interface for clarity ---
interface AppliedJobsResponse {
  applied_job_ids: number[];
}

@Component({
  selector: 'candidate-home',
  templateUrl: 'candidate-home.component.html',
  styleUrls: ['candidate-home.component.css'],
})
export class CandidateHome implements OnInit {
  userProfile: any = {}; // To store user profile data
  defaultProfilePicture: string = "/assets/placeholders/profile-placeholder.jpg";

  jobs: any[] = [];
  
  // --- ADDED: Missing jobScores property ---
  jobScores: { [key: number]: number } = {};

  appliedJobIds: number[] = [];

  processingApplications: { [key: number]: boolean } = {};
  applicationSuccess: { [key: number]: boolean } = {};
  isLoading: boolean = true;

  images = [
    'src/assets/temp-jobs-icon/1.png',
    'src/assets/temp-jobs-icon/2.png',
    'src/assets/temp-jobs-icon/3.png',
    'src/assets/temp-jobs-icon/4.png',
    'src/assets/temp-jobs-icon/5.png',
    'src/assets/temp-jobs-icon/6.png',
    'src/assets/temp-jobs-icon/7.png',
    'src/assets/temp-jobs-icon/8.png'
  ];

  getRandomImage(): string {
    const randomIndex = Math.floor(Math.random() * this.images.length);
    return this.images[randomIndex];
  }

  jobsWithImages = this.jobs.map(job => ({
    ...job,
    imageSrc: this.getRandomImage()
  }));

  private apiUrl = environment.apiUrl+'api/jobs/'; // Adjust to your Django server URL


  constructor(
    private title: Title,
    private meta: Meta,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    this.title.setTitle('Candidate-Home - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Candidate-Home - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  ngOnInit(): void {
    this.loadJobsAndScores();
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      this.userProfile = JSON.parse(profileData);
    } else {
      console.log("User Profile NOT fetched");
    }
  }

  // --- UPDATED AND REFACTORED METHOD ---
  loadJobsAndScores(): void {
    this.isLoading = true;
    
    forkJoin({
      jobs: this.http.get<any[]>(this.apiUrl),
      appliedJobs: this.authService.getAppliedJobs().pipe(catchError(() => of({ applied_job_ids: [] })))
    }).subscribe({
      next: (results) => {
        this.appliedJobIds = results.appliedJobs.applied_job_ids || [];
        this.jobs = results.jobs.filter(job => !this.appliedJobIds.includes(job.job_id));

        // After jobs are filtered, fetch their scores
        if (this.jobs.length > 0) {
          this.fetchMatchScores();
        } else {
          this.isLoading = false; // No jobs to score, stop loading
        }
      },
      error: (error) => {
        console.error('Error loading initial job data:', error);
        this.isLoading = false;
      }
    });
  }

  // --- NEW METHOD TO FETCH SCORES ---
  fetchMatchScores(): void {
    const jobIdsToScore = this.jobs.map(job => job.job_id);

    this.authService.getMatchScores(jobIdsToScore).subscribe({
      next: (scores) => {
        console.log('Received scores:', scores);
        this.jobScores = scores;
        this.isLoading = false; // All data is loaded, stop loading
      },
      error: (error) => {
        console.error('Error fetching job match scores:', error);
        this.isLoading = false; // Stop loading even if scores fail
      }
    });
  }

  fetchJobs(): void {
    this.http.get<any[]>(this.apiUrl, {withCredentials: true}).subscribe(
      (data) => {
        this.jobs = data;
      },
      (error) => {
        console.error('Error fetching jobs:', error);
      }
    );
  }

  navigateToAssessment(jobId: number): void {
    this.router.navigate(['/flashyre-rules', jobId]);
  }

  applyForJob(jobId: number, index: number): void {
    this.processingApplications[jobId] = true;
    
    this.authService.applyForJob(jobId).subscribe({
      next: (response) => {
        console.log('Application successful:', response);
        this.applicationSuccess[jobId] = true;
        
        // Add job to applied jobs list
        this.appliedJobIds.push(jobId);
        
        // Remove the job card after a delay
        setTimeout(() => {
          this.jobs = this.jobs.filter(job => job.job_id !== jobId);
        }, 2000);
      },
      error: (error) => {
        console.error('Application failed:', error);
        this.processingApplications[jobId] = false;
        alert(error.error?.error || 'Failed to apply for this job');
      },
      // --- ADDED: Complete handler to reset processing state ---
      complete: () => {
        this.processingApplications[jobId] = false;
      }
    });
  }
}