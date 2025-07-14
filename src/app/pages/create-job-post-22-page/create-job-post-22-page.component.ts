// src/app/pages/create-job-post-22-page/create-job-post-22-page.component.ts

import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JobCreationWorkflowService } from '../../services/job-creation-workflow.service';
import { CorporateAuthService } from 'src/app/services/corporate-auth.service';

@Component({
  selector: 'create-job-post22-page',
  templateUrl: 'create-job-post-22-page.component.html',
  styleUrls: ['create-job-post-22-page.component.css'],
})
export class CreateJobPost22Page implements OnInit {
  jobUniqueId: string | null = null;
  isLoading: boolean = true;
  rawp0sg: string = ' '; // This was in the original file, kept for template compatibility.

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    private snackBar: MatSnackBar,
    private workflowService: JobCreationWorkflowService,
    private authService: CorporateAuthService
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Create Assessment - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Create Assessment - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);

    // 1. Check for an active login session first.
    if (!this.authService.isLoggedIn()) {
      this.snackBar.open('Your session has expired. Please log in.', 'Close', { duration: 5000 });
      this.router.navigate(['/login-corporate']);
      return;
    }

    // 2. Retrieve the active job ID from the workflow service.
    this.jobUniqueId = this.workflowService.getCurrentJobId();

    // 3. If no ID is found, the user should not be on this page. Redirect them.
    if (!this.jobUniqueId) {
      this.snackBar.open('No active job creation flow found. Please start again.', 'Close', { duration: 4000 });
      this.router.navigate(['/create-job-post-1st-page']);
      return;
    }

    // 4. If all checks pass, stop the loading indicator to render the main component.
    this.isLoading = false;
  }

  /**
   * Handles the click event for the back arrow in the page's header.
   * This navigates the user to the previous step in the workflow.
   */
  onPrevious(): void {
    this.router.navigate(['/create-job-post-21-page']);
  }
}