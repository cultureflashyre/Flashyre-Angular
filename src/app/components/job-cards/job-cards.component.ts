// src/app/components/job-cards/job-cards.component.ts

import { Component, OnInit, Output, EventEmitter, Input, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'job-cards',
  templateUrl: './job-cards.component.html',
  styleUrls: ['./job-cards.component.css'],
})
export class JobCardsComponent implements OnInit, OnChanges {
  // --- [MODIFIED] This component now receives its data directly ---
  @Input() jobsToDisplay: any[] = [];
  @Input() isLoading: boolean = true;
  @Input() errorMessage: string | null = null;
  
  // --- Unchanged Properties ---
  @Input() rootClassName: string = '';
  @Input() text: TemplateRef<any> | null = null;
  @Input() text1: TemplateRef<any> | null = null;
  @Input() text2: TemplateRef<any> | null = null;
  @Output() jobSelected = new EventEmitter<number | undefined>();

  public clickedIndex: number | null = null;
  
  // The 'jobs' property is now a local copy for rendering
  public jobs: any[] = [];

  constructor() {}

  ngOnInit(): void {
    // When the component initializes, it populates its local 'jobs' array
    this.jobs = this.jobsToDisplay;
    this.selectFirstJob();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // --- [NEW] This is the core logic now ---
    // When the parent component gives us a new list of jobs, we update our local list.
    if (changes['jobsToDisplay'] && !changes['jobsToDisplay'].firstChange) {
      this.jobs = this.jobsToDisplay;
      this.selectFirstJob();
    }
  }
  
  /**
   * [NEW] A helper function to select the first job in the current list, if available.
   */
  private selectFirstJob(): void {
    if (this.jobs && this.jobs.length > 0) {
      this.selectJob(this.jobs[0].job_id);
    } else {
      // If the list is empty, inform the parent that nothing is selected.
      this.clickedIndex = null;
      this.jobSelected.emit(undefined);
    }
  }

  /**
   * [UNCHANGED] Handles the click event on a job card.
   */
  public selectJob(jobId: number): void {
    console.log(`[JobCardsComponent] selectJob: Job card with ID ${jobId} was clicked.`);
    const clickedJobIndex = this.jobs.findIndex(job => job.job_id === jobId);
    if (clickedJobIndex !== -1) {
      this.clickedIndex = clickedJobIndex;
    }
    this.jobSelected.emit(jobId);
  }
}