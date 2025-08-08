import { Component, ViewChild, ElementRef } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AdminService } from '../../services/admin.service'; // Ensure this path is correct

@Component({
  selector: 'admin-page1',
  templateUrl: 'admin-page1.component.html',
  styleUrls: ['admin-page1.component.css'],
})
export class AdminPage1 {
  // ==============================================================================
  // CLASS PROPERTIES
  // ==============================================================================

  /** State flags to manage loading indicators for each upload type independently. */
  public isCvUploading = false;
  public isJdUploading = false;

  /** A message to display feedback to the user after an upload attempt. */
  public uploadMessage = '';

  /** ViewChild decorators to get a direct reference to the hidden file input elements in the template. */
  @ViewChild('cvFileInput') cvFileInput: ElementRef;
  @ViewChild('jdFileInput') jdFileInput: ElementRef;

  // ==============================================================================
  // CONSTRUCTOR & LIFECYCLE HOOKS
  // ==============================================================================

  constructor(
    private title: Title,
    private meta: Meta,
    private adminService: AdminService // Inject the central admin service
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

  // ==============================================================================
  // CV UPLOAD METHODS
  // ==============================================================================

  /**
   * Programmatically clicks the hidden file input element for CVs.
   * This is called when the user clicks the "CV Bulk Upload" button.
   */
  triggerCvUpload(): void {
    if (!this.isCvUploading) {
      this.cvFileInput.nativeElement.click();
    }
  }

  /**
   * Handles the file selection event for CVs. It calls the admin service
   * to upload the selected files and updates the UI state accordingly.
   * @param event The file input change event containing the selected files.
   */
  onCvFilesSelected(event: any): void {
    const files: File[] = Array.from(event.target.files);
    if (files.length === 0) {
      return;
    }

    this.isCvUploading = true;
    this.uploadMessage = `Uploading and processing ${files.length} CV(s)... Please wait.`;

    this.adminService.uploadCVs(files).subscribe({
      next: (response) => {
        this.isCvUploading = false;
        this.uploadMessage = response.message || 'CVs processed successfully!';
        // Reset the file input to allow uploading the same file(s) again if needed.
        this.cvFileInput.nativeElement.value = '';
        // Note: We no longer need to manually refresh the child component list.
        // That component is no longer part of this parent.
      },
      error: (err) => {
        this.isCvUploading = false;
        this.uploadMessage = err.error?.error || 'An unknown error occurred during CV upload.';
        this.cvFileInput.nativeElement.value = '';
      },
    });
  }

  // ==============================================================================
  // JOB DESCRIPTION (JD) UPLOAD METHODS
  // ==============================================================================

  /**
   * Programmatically clicks the hidden file input element for the JD.
   * This is called when the user clicks the "JD Upload" button.
   */
  triggerJdUpload(): void {
    if (!this.isJdUploading) {
      this.jdFileInput.nativeElement.click();
    }
  }

  /**
   * Handles the file selection event for the JD. It calls the admin service
   * to upload the file and updates the UI state.
   * @param event The file input change event containing the selected file.
   */
  onJdFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) {
      return;
    }

    this.isJdUploading = true;
    this.uploadMessage = `Uploading and processing JD: ${file.name}...`;

    this.adminService.uploadJd(file).subscribe({
      next: (response) => {
        this.isJdUploading = false;
        this.uploadMessage = `Successfully processed JD for role: ${response.role || 'N/A'}`;
        this.jdFileInput.nativeElement.value = '';
        // The service automatically notifies other components of the new active JD.
      },
      error: (err) => {
        this.isJdUploading = false;
        this.uploadMessage = err.error?.error || 'An unknown error occurred during JD upload.';
        this.jdFileInput.nativeElement.value = '';
      },
    });
  }
}