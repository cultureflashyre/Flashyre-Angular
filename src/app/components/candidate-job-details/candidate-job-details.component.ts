import { Component, Input, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';
import { JobsService } from '../../services/job.service';

@Component({
  selector: 'candidate-job-details',
  templateUrl: './candidate-job-details.component.html',
  styleUrls: ['./candidate-job-details.component.css'],
})
export class CandidateJobDetailsComponent implements OnChanges {
  @Input() rootClassName: string = 'candidate-default-root';
  @Input() jobId: number | null = null;
  @Input() text: TemplateRef<any> | null = null;
  @Input() text1: TemplateRef<any> | null = null;
  @Input() text2: TemplateRef<any> | null = null;
  @Input() text3: TemplateRef<any> | null = null;
  @Input() button: TemplateRef<any> | null = null;
  @Input() button1: TemplateRef<any> | null = null;

  job: any = {
    job_id: null,
    company_name: '',
    logo: '',
    title: '',
    location: '',
    job_type: '',
    created_at: '',
    description: '',
    requirements: '',
    salary: null,
    url: null
  };

  constructor(private jobService: JobsService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jobId'] && this.jobId !== null) {
      this.fetchJobDetails();
    } else if (!this.jobId) {
      this.resetJob();
    }
  }

  private fetchJobDetails(): void {
    this.jobService.getJobById(this.jobId!).subscribe({
      next: (data) => {
        console.log('Job details response:', data); // Debug API response
        this.job = {
          job_id: data.job_id || null,
          company_name: data.company_name || '',
          logo: data.logo || '',
          title: data.title || '',
          location: data.location || '',
          job_type: data.job_type || '',
          created_at: data.created_at || '',
          description: data.description || '',
          requirements: data.requirements || '',
          salary: data.salary || null,
          url: data.url || null
        };
      },
      error: (err) => {
        console.error('Error fetching job details:', err);
        this.resetJob();
      }
    });
  }

  private resetJob(): void {
    this.job = {
      job_id: null,
      company_name: '',
      logo: '',
      title: '',
      location: '',
      job_type: '',
      created_at: '',
      description: '',
      requirements: '',
      salary: null,
      url: null
    };
  }

  applyForJob(): void {
    if (this.job.url) {
      window.open(this.job.url, '_blank');
    } else {
      console.warn('No application URL provided for this job.');
    }
  }
}