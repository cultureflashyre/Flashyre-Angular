import { Component, OnInit, Output, EventEmitter, Input, TemplateRef } from '@angular/core';
import { JobsService } from '../../services/job.service';

@Component({
  selector: 'job-cards',
  templateUrl: './job-cards.component.html',
  styleUrls: ['./job-cards.component.css'],
})
export class JobCardsComponent implements OnInit {
  @Input() rootClassName: string = '';
  @Input() text: TemplateRef<any> | null = null;
  @Input() text1: TemplateRef<any> | null = null;
  @Input() text2: TemplateRef<any> | null = null;
  @Output() jobSelected = new EventEmitter<number>();
  jobs: any[] = [];

  constructor(private jobService: JobsService) {}

  ngOnInit(): void {
    this.jobService.getJobs().subscribe({
      next: (data) => {
        console.log('Jobs fetched:', data.map(job => ({ job_id: job.job_id, title: job.title })));
        this.jobs = data;
      },
      error: (err) => {
        console.error('Error fetching jobs:', err);
        this.jobs = [];
      }
    });
  }

  selectJob(jobId: number): void {
    console.log('Emitting jobId:', jobId);
    this.jobSelected.emit(jobId);
  }
}