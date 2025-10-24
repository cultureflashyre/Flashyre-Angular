// src/app/components/job-cards/job-cards.component.ts

import { Component, OnInit, Output, EventEmitter, Input, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'job-cards',
  templateUrl: './job-cards.component.html',
  styleUrls: ['./job-cards.component.css'],
})
export class JobCardsComponent implements OnInit, OnChanges {
  // --- INPUTS ---

  /**
   * The array of job objects to be displayed, provided by the parent component.
   */
  @Input() jobsToDisplay: any[] = [];

  /**
   * The ID of the currently selected job, used to apply a visual highlight.
   */
  @Input() selectedJobId: number | null = null;

  /**
   * Flag to show a loading indicator, controlled by the parent.
   */
  @Input() isLoading: boolean = true;

  /**
   * An error message to display, controlled by the parent.
   */
  @Input() errorMessage: string | null = null;

  /**
   * Flag indicating if filters resulted in no matches, controlled by the parent.
   */
  @Input() noMatchesFound: boolean = false;
  
  // Inputs for theming and content projection
  @Input() rootClassName: string = '';
  @Input() text: TemplateRef<any> | null = null;
  @Input() text1: TemplateRef<any> | null = null;
  @Input() text2: TemplateRef<any> | null = null;

  // --- OUTPUTS ---

  /**
   * Emits the full job object when a user clicks on a job card.
   */
  @Output() jobSelected = new EventEmitter<any>();

  constructor() {}

  ngOnInit(): void {
    // On initial load, check if a default selection should be made.
    this.selectInitialJob();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When the list of jobs is updated by the parent...
    if (changes['jobsToDisplay'] && !changes['jobsToDisplay'].firstChange) {
      // ...check if the currently highlighted job still exists in the new list.
      const currentSelectionIsValid = this.jobsToDisplay.some(
        (job) => job.job_id === this.selectedJobId
      );

      // If the selected job is no longer in the list (e.g., due to filtering),
      // select the new first job as a sensible default.
      if (!currentSelectionIsValid) {
        this.selectInitialJob();
      }
    }
  }

  /**
   * Selects the first job in the list if no job is already selected.
   * This ensures the details view is never empty when jobs are available.
   */
  private selectInitialJob(): void {
    if (!this.isLoading && !this.errorMessage && this.jobsToDisplay.length > 0) {
      // If no job is currently selected, emit the first one to the parent.
      if (!this.selectedJobId) {
        this.jobSelected.emit(this.jobsToDisplay[0]);
      }
    }
  }

  /**
   * Handles the click event on a job card.
   * Emits the selected job object to the parent component, which will then
   * update the application state.
   * @param job The full job object that was clicked.
   */
  public selectJob(job: any): void {
    if (job && job.job_id) {
      this.jobSelected.emit(job);
    }
  }
}