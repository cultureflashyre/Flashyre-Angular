// src/app/pages/admin-page1/admin-page1.component.ts

import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AdminService } from '../../services/admin.service';
import { AdminPage1Component as AdminPage1ChildComponent } from '../../components/admin-page1-component/admin-page1-component.component';

const ACTIVE_JOB_ID_KEY = 'active_job_processing_id';

@Component({
  selector: 'admin-page1',
  templateUrl: 'admin-page1.component.html',
  styleUrls: ['admin-page1.component.css'],
})
export class AdminPage1 implements OnInit {
  public activeView: 'resumes' | 'jobDescription' = 'resumes';
  public isUploadingCVs: boolean = false;
  public isUploadingJd: boolean = false;

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

  ngOnInit(): void {
    const activeJobId = sessionStorage.getItem(ACTIVE_JOB_ID_KEY);
    if (activeJobId) {
      this.activeView = 'jobDescription';
    }
  }

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
            // --- FIX: Call the new public refresh method which takes no arguments ---
            this.adminPage1Component.refreshFiltersAndLoadLatest();
            // --- END FIX ---
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

    this.cvUploader.nativeElement.value = '';
  }

  onJdFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.isUploadingJd = true;

    this.adminService.uploadJd(file).subscribe({
      next: (response) => {
        alert(`Successfully uploaded and processed JD for role: ${response.role}. The view will now switch.`);
        sessionStorage.setItem(ACTIVE_JOB_ID_KEY, response.job_id.toString());
        this.activeView = 'jobDescription';
      },
      error: (err) => {
        console.error('JD upload failed:', err);
        const errorMessage = err.error?.error || 'An unknown server error occurred. Please try again.';
        alert(`JD upload failed: ${errorMessage}`);
      },
      complete: () => {
        this.isUploadingJd = false;
      }
    });

    this.jdUploader.nativeElement.value = '';
  }
}