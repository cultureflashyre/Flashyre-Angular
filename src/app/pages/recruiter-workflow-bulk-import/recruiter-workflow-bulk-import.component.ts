import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';
import { RecruiterWorkflowBulkImportService } from '../../services/recruiter-workflow-bulk-import.service'; // Import Service
import { finalize } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-bulk-import',
  templateUrl: './recruiter-workflow-bulk-import.component.html',
  styleUrls: ['./recruiter-workflow-bulk-import.component.css'],
  imports: [CommonModule, RecruiterWorkflowNavbarComponent]
})
export class RecruiterWorkflowBulkImportComponent {
  selectedFile: File | null = null;
  isUploading: boolean = false; // Controls the Spinner
  uploadResult: any = null;

  // Inject the specific service instead of HttpClient
  constructor(private bulkImportService: RecruiterWorkflowBulkImportService) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.uploadResult = null;
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      this.selectedFile = event.dataTransfer.files[0];
      this.uploadResult = null;
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  uploadFile() {
    if (!this.selectedFile) return;

    this.isUploading = true; // 🟢 SHOW SPINNER
    this.uploadResult = null;

    // Use the Service to handle the API call
    this.bulkImportService.uploadCandidateFile(this.selectedFile)
      .pipe(
        // finalize ensures spinner hides on both Success AND Error
        finalize(() => {
          this.isUploading = false; // 🔴 HIDE SPINNER
        })
      )
      .subscribe({
        next: (res: any) => {
          this.uploadResult = res;
        },
        error: (err) => {
          console.error('Import Error:', err);
          this.uploadResult = { 
            success: false, 
            message: 'Import Failed: ' + (err.error?.error || 'Server connection error') 
          };
        }
      });
  }
}