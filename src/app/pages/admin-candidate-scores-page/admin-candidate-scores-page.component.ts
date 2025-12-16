// src/app/pages/admin-candidate-scores-page/admin-candidate-scores-page.component.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminJobCreationWorkflowService } from '../../services/admin-job-creation-workflow.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { AdminJobDescriptionService } from '../../services/admin-job-description.service';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import * as XLSX from 'xlsx'; // Import xlsx for Excel export

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NavbarForAdminView } from 'src/app/components/navbar-for-admin-view/navbar-for-admin-view.component';
import { environment } from '../../../environments/environment'; // Ensure environment is imported


@Component({
  selector: 'admin-candidate-scores-page',
  standalone: true,
  imports: [
    // 4. List all its dependencies here
    CommonModule, // For *ngIf, *ngFor, etc.
    FormsModule,  // For [(ngModel)]
    RouterModule,
    NavbarForAdminView,

    // Add the shared components your HTML template needs

  ],
  templateUrl: './admin-candidate-scores-page.component.html',
  styleUrls: ['./admin-candidate-scores-page.component.css']
})
export class AdminCandidateScoresPageComponent implements OnInit {
    userProfile: any = {};
  jobUniqueId: string | null = null; // Store the job unique ID
  candidates: any[] = []; // Store candidate data with selected property
  loading: boolean = false; // Loading state for API call
  error: string | null = null; // Error message for API failures
  isAllSelected: boolean = false; // Track all selection state
  rootClassName: string = 'default-root'; // Default class name for ngClass

  constructor(
    private workflowService: AdminJobCreationWorkflowService, // Workflow service for job ID
    private router: Router, // Router for navigation
    private authService: CorporateAuthService, // Authentication service
    private jobDescriptionService: AdminJobDescriptionService, // Service for job-related API calls
    private http: HttpClient
  ) {
    // Initialize candidates with selected property
    this.candidates = this.candidates.map(c => ({ ...c, selected: false }));
  }

  ngOnInit(): void {
    // Get the job ID from the workflow service
    this.jobUniqueId = this.workflowService.getCurrentJobId();
    if (!this.jobUniqueId) {
      console.error('No active job found in workflow. Redirecting...');
      this.router.navigate(['/job-post-list']);
      return;
    }
    this.loadCandidates(); // Load candidates for the job
  }

  // Load candidates with scores for the job
  private loadCandidates(): void {
    this.loading = true; // Set loading state
    this.error = null; // Reset error
    const token = localStorage.getItem('jwtToken'); // Replace 'auth_token' with the actual key
    if (!token) {
      this.error = 'Authentication token not found.';
      this.loading = false;
      return;
    }

    this.jobDescriptionService.getSourcedCandidatesWithScores(this.jobUniqueId!, token, 'score_desc')
      .pipe(
        tap(response => {
          if (response.status === 'success' && response.data && response.data.candidates) {
            this.candidates = response.data.candidates.map(c => ({ ...c, selected: false })); // Add selected property
          } else {
            this.error = 'Invalid response format from server.';
          }
          this.loading = false; // Clear loading state
        }),
        catchError(err => {
          this.error = err.message || 'Failed to load candidates.';
          this.loading = false; // Clear loading state
          return throwError(() => new Error(this.error));
        })
      )
      .subscribe();
  }

  // Toggle select all checkbox
onSelectAllChange(isSelected: boolean): void {
  if (this.candidates) {
    this.candidates.forEach(candidate => candidate.selected = isSelected);
  }
}

  // Update select all state when individual checkboxes change
  updateSelectAllState(): void {
    this.isAllSelected = this.candidates.every(c => c.selected);
  }

  // Apply client-side sorting
  applySort(sortBy: string): void {
    switch (sortBy) {
      case 'score_desc':
        this.candidates.sort((a, b) => b.score - a.score);
        break;
      case 'score_asc':
        this.candidates.sort((a, b) => a.score - b.score);
        break;
      case 'name_asc':
        this.candidates.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        this.candidates.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }
  }

  // Trigger bulk download as Excel
  triggerBulkDownload(): void {
    const selectedCandidates = this.candidates.filter(c => c.selected);
    if (selectedCandidates.length === 0) {
      this.error = 'No candidates selected for download.';
      return;
    }

    const worksheetData = selectedCandidates.map(c => ({
      'Name': c.name,
      'Email': c.email,
      'Score': c.score,
      'Total Experience': c.details.total_experience,
      'Relevant Experience': c.details.relevant_experience,
      'Location': c.details.location,
      'Skills': c.details.skills.join(', '),
      'Education': c.details.education,
      'Certification': c.details.certification
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');
    XLSX.writeFile(workbook, `candidate_scores_${this.jobUniqueId}.xlsx`);
  }

  // Download individual candidate resume
  downloadCandidateResume(candidate: any): void {
    if (!candidate || !candidate.candidate_id) {
      console.error('Candidate ID missing');
      this.error = `Cannot download resume: Invalid candidate data.`;
      return;
    }

    // Construct the URL to your new Django Proxy Endpoint
    // Adjust the path segment ('api/admin/job-post/') to match your main urls.py prefix for the admin_job_post app
    const downloadUrl = `${environment.apiUrl}api/admin/job-post/download-cv/${candidate.candidate_id}/`;
    
    // Get the token
    const token = localStorage.getItem('jwtToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.loading = true; // Optional: show loading indicator

    this.http.get(downloadUrl, { 
      headers: headers, 
      responseType: 'blob' // Important: Tell Angular to expect a binary file
    }).subscribe({
      next: (blob: Blob) => {
        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a hidden anchor tag
        const link = document.createElement('a');
        link.href = url;
        
        // Set the filename
        // We try to use the candidate name for a clean file name
        const cleanName = candidate.name ? candidate.name.replace(/\s+/g, '_') : 'Candidate';
        // Default extension to pdf, though the browser often detects it from the blob type
        link.download = `Resume_${cleanName}.pdf`;
        
        // Trigger the download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.loading = false;
        }, 100);
        
        console.log('Resume downloaded successfully via proxy for:', candidate.name);
      },
      error: (err) => {
        console.error('Failed to download resume:', err);
        this.error = `Could not download resume for ${candidate.name}. Server error.`;
        this.loading = false;
      }
    });
  }

  // Navigate back to job setup (step 4)
  onBackToJobSetup(): void {
    this.router.navigate(['/create-job-step4']);
  }
}