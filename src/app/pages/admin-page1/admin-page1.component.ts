// src/app/pages/admin-page1/admin-page1.component.ts

import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AdminService } from '../../services/admin.service';
import { AdminPage1Component as AdminPage1ChildComponent } from '../../components/admin-page1-component/admin-page1-component.component';

// --- NEW: Key for session storage to persist the active job context across page loads ---
const ACTIVE_JOB_ID_KEY = 'active_job_processing_id';

@Component({
  selector: 'admin-page1',
  templateUrl: 'admin-page1.component.html',
  styleUrls: ['admin-page1.component.css'],
})
export class AdminPage1 implements OnInit {
  // --- Component State Properties ---
  public activeView: 'resumes' | 'jobDescription' = 'resumes';
  public isUploadingCVs: boolean = false;
  public isUploadingJd: boolean = false;

  // --- ViewChild Decorators to access child components and template elements ---
  @ViewChild(AdminPage1ChildComponent) adminPage1Component!: AdminPage1ChildComponent;
  @ViewChild('cvUploader') cvUploader!: ElementRef;
  @ViewChild('jdUploader') jdUploader!: ElementRef;

  constructor(
    private title: Title,
    private meta: Meta,
    private adminService: AdminService
  ) {
    this.title.setTitle('Admin-Page1 - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Admin-Page1 - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  // --- MODIFIED: Implements OnInit for stateful behavior ---
  ngOnInit(): void {
    // Check session storage on initialization. If a job ID exists, it means the user
    // recently uploaded a JD, so we should default to the "Job Description" tab.
    const activeJobId = sessionStorage.getItem(ACTIVE_JOB_ID_KEY);
    if (activeJobId) {
      this.activeView = 'jobDescription';
    }
  }

  // --- Method to handle CV file selection and upload (Unchanged) ---
  onCvFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);
    const validFiles: File[] = [];
    const maxFileSize = 5 * 1024 * 1024; // 5 MB

    files.forEach(file => {
      if (file.size > maxFileSize) {
        alert(`Error: File "${file.name}" is larger than 5MB and will be ignored.`);
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      this.isUploadingCVs = true;
      this.adminService.uploadCVs(validFiles).subscribe({
        next: (response) => {
          alert(`Successfully uploaded ${response.processed_files.length} CV(s). The list will now refresh.`);
          if (this.adminPage1Component) {
            this.adminPage1Component.fetchCandidates();
          }
        },
        error: (err) => {
          console.error('CV upload failed:', err);
          alert(`CV upload failed: ${err.error?.error || 'Please try again.'}`);
        },
        complete: () => {
          this.isUploadingCVs = false;
        }
      });
    }

    // Reset the file input to allow re-uploading the same file
    this.cvUploader.nativeElement.value = '';
  }

  // --- MODIFIED: Method to handle JD file selection with enhanced UX and statefulness ---
  onJdFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.isUploadingJd = true;

    // The API call is synchronous and blocking. The UI will show a loading overlay
    // while waiting for the backend to complete the entire scoring process.
    this.adminService.uploadJd(file).subscribe({
      next: (response) => {
        alert(`Successfully uploaded and processed JD for role: ${response.role}. The view will now switch.`);
        
        // --- NEW: Save the job ID to session storage for state persistence ---
        // This allows the app to remember the context even if the user reloads the page.
        sessionStorage.setItem(ACTIVE_JOB_ID_KEY, response.job_id.toString());
        
        // Switch view on success to show the results
        this.activeView = 'jobDescription';
      },
      error: (err) => {
        console.error('JD upload failed:', err);
        // Provide more specific feedback from the backend if available
        const errorMessage = err.error?.error || 'An unknown server error occurred. Please try again.';
        alert(`JD upload failed: ${errorMessage}`);
      },
      complete: () => {
        this.isUploadingJd = false;
      }
    });

    // Reset the file input to allow re-uploading the same file
    this.jdUploader.nativeElement.value = '';
  }
}