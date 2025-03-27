import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

import { AuthService } from '../../services/candidate.service';
import { forkJoin } from 'rxjs';

import { environment } from '../../../environments/environment';


@Component({
  selector: 'candidate-home',
  templateUrl: 'candidate-home.component.html',
  styleUrls: ['candidate-home.component.css'],
})
export class CandidateHome implements OnInit {
  jobs: any[] = [];

  appliedJobIds: number[] = [];

  processingApplications: { [key: number]: boolean } = {};
  applicationSuccess: { [key: number]: boolean } = {};
  isLoading: boolean = true;

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
    this.loadJobsAndFilterApplied();
  }

  loadJobsAndFilterApplied(): void {
    this.isLoading = true;
    
    // Get both jobs and applied job IDs in parallel
    forkJoin({
      jobs: this.http.get<any[]>(this.apiUrl, {withCredentials: true}),
      appliedJobs: this.authService.getAppliedJobs()
    }).subscribe(
      (results) => {
        // Store applied job IDs
        this.appliedJobIds = results.appliedJobs.applied_job_ids || [];
        
        // Filter out jobs that the user has already applied for
        this.jobs = results.jobs.filter(job => 
          !this.appliedJobIds.includes(job.job_id)
        );
        
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading data:', error);
        // If error occurs, still try to load jobs
        this.fetchJobs();
        this.isLoading = false;
      }
    );
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
    
    this.authService.applyForJob(jobId).subscribe(
      (response) => {
        console.log('Application successful:', response);
        this.applicationSuccess[jobId] = true;
        
        // Add job to applied jobs list
        this.appliedJobIds.push(jobId);
        
        // Remove the job card after a delay
        setTimeout(() => {
          this.jobs = this.jobs.filter(job => job.job_id !== jobId);
        }, 2000);
      },
      (error) => {
        console.error('Application failed:', error);
        this.processingApplications[jobId] = false;
        alert(error.error?.error || 'Failed to apply for this job');
      }
    );
  }
}