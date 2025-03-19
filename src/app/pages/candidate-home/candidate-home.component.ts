import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'candidate-home',
  templateUrl: 'candidate-home.component.html',
  styleUrls: ['candidate-home.component.css'],
})
export class CandidateHome implements OnInit {
  jobs: any[] = [];
  private apiUrl = environment.apiUrl+'api/jobs/'; // Adjust to your Django server URL

  constructor(
    private title: Title,
    private meta: Meta,
    private http: HttpClient,
    private router: Router
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
}