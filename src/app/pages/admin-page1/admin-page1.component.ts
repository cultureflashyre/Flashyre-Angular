import { Component, ViewChild, ElementRef } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AdminService } from '../../services/admin.service'; // Correct path to your service
import { AdminPage1Component as CandidateListComponent } from '../../components/admin-page1-component/admin-page1-component.component'; // Import child component

@Component({
  selector: 'admin-page1',
  templateUrl: 'admin-page1.component.html',
  styleUrls: ['admin-page1.component.css'],
})
export class AdminPage1 {
  // State for managing the upload process
  public isUploading = false;
  public uploadMessage = '';

  // Get a reference to the hidden file input element
  @ViewChild('fileInput') fileInput: ElementRef;
  // Get a reference to the child component to call its methods
  @ViewChild(CandidateListComponent) candidateList: CandidateListComponent;

  constructor(
    private title: Title,
    private meta: Meta,
    private adminService: AdminService // Inject the service
  ) {
    this.title.setTitle('Admin-Page1 - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Admin-Page1 - Flashyre',
      },
      // ... other meta tags
    ]);
  }

  /**
   * Programmatically clicks the hidden file input element.
   */
  triggerFileUpload(): void {
    if (!this.isUploading) {
      this.fileInput.nativeElement.click();
    }
  }

  /**
   * Handles the file selection event.
   * @param event The file input change event.
   */
  onFilesSelected(event: any): void {
    const files: File[] = Array.from(event.target.files);
    if (files.length === 0) {
      return;
    }

    this.isUploading = true;
    this.uploadMessage = `Uploading and processing ${files.length} file(s)... This may take a moment.`;

    this.adminService.uploadCVs(files).subscribe({
      next: (response) => {
        this.isUploading = false;
        this.uploadMessage = response.message || 'Upload successful!';
        // After a successful upload, tell the child component to refresh its data
        if (this.candidateList) {
          this.candidateList.loadCandidates();
        }
        // Reset the file input so the user can upload the same file again
        this.fileInput.nativeElement.value = '';
      },
      error: (err) => {
        this.isUploading = false;
        this.uploadMessage = err.error?.error || 'An unknown error occurred during upload.';
        this.fileInput.nativeElement.value = '';
      },
    });
  }
}