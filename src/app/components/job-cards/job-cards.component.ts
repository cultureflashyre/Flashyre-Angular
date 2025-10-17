// src/app/components/job-cards/job-cards.component.ts

import { Component, OnInit, Output, EventEmitter, Input, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'job-cards',
  templateUrl: './job-cards.component.html',
  styleUrls: ['./job-cards.component.css'],
})
export class JobCardsComponent implements OnInit, OnChanges {
  @Input() jobsToDisplay: any[] = [];
  @Input() isLoading: boolean = true;
  @Input() errorMessage: string | null = null;
  @Input() rootClassName: string = '';
  @Input() text: TemplateRef<any> | null = null;
  @Input() text1: TemplateRef<any> | null = null;
  @Input() text2: TemplateRef<any> | null = null;
  @Output() jobSelected = new EventEmitter<number | undefined>();

  public jobs: any[] = [];
  public selectedJobIdInternal: number | null = null; // Renamed to avoid confusion with parent's input

  constructor() {}

  ngOnInit(): void {
    // Initialize local jobs array from input
    this.jobs = this.jobsToDisplay;
    this.selectFirstJob();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jobsToDisplay'] && !changes['jobsToDisplay'].firstChange) {
      this.jobs = changes['jobsToDisplay'].currentValue;
      this.selectFirstJob();
    }
  }
  
  private selectFirstJob(): void {
    if (this.jobs && this.jobs.length > 0) {
      this.selectJob(this.jobs[0]); // Pass the full job object to selectJob
    } else {
      this.selectedJobIdInternal = null;
      this.jobSelected.emit(undefined);
    }
  }

  /**
   * Handles the click event on a job card.
   * @param job The full job object that was clicked.
   */
  public selectJob(job: any): void {
    if (!job || !job.job_id) {
      this.selectedJobIdInternal = null;
      this.jobSelected.emit(undefined);
      return;
    }

    this.selectedJobIdInternal = job.job_id;
    this.jobSelected.emit(job.job_id);
  }
}