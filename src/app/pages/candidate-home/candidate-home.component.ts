import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { AuthService } from '../../services/candidate.service';

@Component({
  selector: 'candidate-home',
  templateUrl: 'candidate-home.component.html',
  styleUrls: ['candidate-home.component.css'],
})
export class CandidateHome implements OnInit {
  jobs: any[] = [];
  private apiUrl = 'http://localhost:8000/api/jobs/';
  processingApplications: { [key: number]: boolean } = {};
  applicationSuccess: { [key: number]: boolean } = {};

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
    this.fetchJobs();
  }

  fetchJobs(): void {
    this.http.get<any[]>(this.apiUrl).subscribe(
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