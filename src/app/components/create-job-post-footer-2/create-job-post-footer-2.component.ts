// src/app/components/create-job-post-footer-2/create-job-post-footer-2.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'create-job-post-footer2',
  templateUrl: 'create-job-post-footer-2.component.html',
  styleUrls: ['create-job-post-footer-2.component.css'],
})
export class CreateJobPostFooter2 {
  /**
   * Allows a custom class to be applied to the root element for styling overrides.
   */
  @Input()
  rootClassName: string = '';

  /**
   * Receives the boolean state from the parent component.
   * When true, the 'Next' button will be disabled.
   */
  @Input()
  isNextDisabled: boolean = false;

  /**
   * Text to display on the 'Next' button. Defaults to 'Next'.
   */
  @Input()
  nextButtonText: string = 'Next';  // New input property

  /**
   * Emits an event when the 'Cancel' button is clicked.
   */
  @Output()
  cancelClick = new EventEmitter<void>();

  /**
   * Emits an event when the 'Previous' button is clicked.
   */
  @Output()
  previousClick = new EventEmitter<void>();

  /**
   * Emits an event when the 'Save Draft' button is clicked.
   */
  @Output()
  saveDraftClick = new EventEmitter<void>();

  /**
   * Emits an event when the 'Skip' button is clicked.
   */
  @Output()
  skipClick = new EventEmitter<void>();

  /**
   * Emits an event when the 'Next' button is clicked.
   */
  @Output()
  nextClick = new EventEmitter<void>();

  constructor() {}
}