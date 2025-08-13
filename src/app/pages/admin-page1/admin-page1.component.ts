import { Component, ViewChild, ElementRef } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AdminService } from '../../services/admin.service'; // Assuming your service is in a services folder
import { AdminPage1Component as AdminPage1ChildComponent } from '../../components/admin-page1-component/admin-page1-component.component';

@Component({
  selector: 'admin-page1',
  templateUrl: 'admin-page1.component.html',
  styleUrls: ['admin-page1.component.css'],
})
export class AdminPage1 {
  // --- NEW ---
  // View management property
  public activeView: 'resumes' | 'jobDescription' = 'resumes';

  // Loading state management for uploads
  public isUploadingCVs: boolean = false;
  public isUploadingJd: boolean = false;

  // ViewChild to get a reference to the child component to call its methods
  @ViewChild(AdminPage1ChildComponent) adminPage1Component!: AdminPage1ChildComponent;

  // ViewChild to access the hidden file input elements
  @ViewChild('cvUploader') cvUploader!: ElementRef;
  @ViewChild('jdUploader') jdUploader!: ElementRef;
  // --- END NEW ---

  constructor(
    private title: Title,
    private meta: Meta,
    private adminService: AdminService // --- NEW: Injected AdminService ---
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

  // --- NEW: Method to handle CV file selection and upload ---
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
          // Refresh the child component's data
          if (this.adminPage1Component) {
            this.adminPage1Component.fetchCandidates();
          }
        },
        error: (err) => {
          console.error('CV upload failed:', err);
          alert(`CV upload failed: ${err.error?.error || 'Please try again.'}`);
          this.isUploadingCVs = false;
        },
        complete: () => {
          this.isUploadingCVs = false;
        }
      });
    }

    // Reset the file input
    this.cvUploader.nativeElement.value = '';
  }

  // --- NEW: Method to handle JD file selection and upload ---
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
        this.activeView = 'jobDescription'; // Switch view on success
      },
      error: (err) => {
        console.error('JD upload failed:', err);
        alert(`JD upload failed: ${err.error?.error || 'Please try again.'}`);
        this.isUploadingJd = false;
      },
      complete: () => {
        this.isUploadingJd = false;
      }
    });

    // Reset the file input
    this.jdUploader.nativeElement.value = '';
  }
}