// src/app/components/admin-candidate-sourced-component/admin-candidate-sourced-component.ts

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AdminService, SourcedCandidate } from '../../services/admin.service';

// Define a type that extends the base SourcedCandidate with a 'selected' property for UI state management
type SelectableSourcedCandidate = SourcedCandidate & { selected: boolean };

@Component({
  selector: 'admin-candidate-sourced-component',
  templateUrl: 'admin-candidate-sourced-component.component.html',
  styleUrls: ['admin-candidate-sourced-component.component.css'],
})
export class AdminCandidateSourcedComponent implements OnChanges {
  // --- Input property to receive the active job ID from the parent ---
  @Input() jobId: number | null = null;
  
  // --- Input property to receive the date filter value from the parent ---
  @Input() filterByDate: string | null = 'all'; 

  @Input() rootClassName: string = '';

  // --- Component state properties ---
  public sourcedCandidates: SelectableSourcedCandidate[] = [];
  public isLoading: boolean = true;
  public isAllSelected: boolean = false;
  // Default sort is by score, descending
  public currentSort: string = 'score_desc'; 

  constructor(private adminService: AdminService) {}

  /**
   * This lifecycle hook is the core of the component's reactivity.
   * It triggers a data refresh if EITHER the jobId or the filterByDate input changes.
   * @param changes An object containing the changed input properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // If either the jobId or filterByDate inputs have changed and we have a valid jobId,
    // then it's time to fetch new data from the backend.
    if ((changes['jobId'] || changes['filterByDate']) && this.jobId) {
      this.fetchSourcedCandidates();
    }
  }

  /**
   * Fetches sourced candidates from the backend using the current job ID, sort order, and date filter.
   * This is the primary method for loading and refreshing data in this component.
   */
  public fetchSourcedCandidates(): void {
    if (!this.jobId) {
        // Do not proceed if there is no valid job ID.
        return;
    }

    this.isLoading = true;
    this.adminService.getSourcedCandidates(this.jobId, this.currentSort, this.filterByDate).subscribe({
      next: (data) => {
        // Map the incoming data to our internal type, initializing 'selected' to false for each candidate.
        this.sourcedCandidates = data.map(c => ({ ...c, selected: false }));
        this.isLoading = false;
        // After data is loaded, reset and update the "select all" checkbox state.
        this.updateSelectAllState(); 
      },
      error: (err) => {
        console.error('Failed to fetch sourced candidates:', err);
        alert('Could not load sourced candidates. Please try again.');
        this.isLoading = false;
      }
    });
  }

  /**
   * Applies a new sort order and re-fetches data from the server.
   * @param sortKey The string key for the new sort order (e.g., 'score_desc', 'name_asc').
   */
  public applySort(sortKey: string): void {
    this.currentSort = sortKey;
    this.fetchSourcedCandidates();
  }

  /**
   * Toggles the selection state of all candidates based on the "Select All" checkbox's value.
   */
  public toggleSelectAll(): void {
    this.sourcedCandidates.forEach(c => c.selected = this.isAllSelected);
  }

  /**
   * Updates the state of the master "Select All" checkbox. It should be checked only if
   * there are candidates and all of them are currently selected.
   */
  public updateSelectAllState(): void {
    if (this.sourcedCandidates.length === 0) {
      this.isAllSelected = false;
      return;
    }
    this.isAllSelected = this.sourcedCandidates.every(c => c.selected);
  }

  /**
   * Downloads a candidate's actual resume file by first fetching a secure,
   * time-limited URL from the backend to prevent unauthorized access.
   * @param candidate The candidate object for whom to download the resume.
   */
  public downloadCandidateResume(candidate: SourcedCandidate): void {
    alert('Preparing secure download link...'); 
    this.adminService.getSecureCvUrl(candidate.candidate_id).subscribe({
        next: (response) => {
            // Trigger the download by opening the secure URL in a new tab.
            window.open(response.url, '_blank');
        },
        error: (err) => {
            console.error('Failed to get secure URL', err);
            alert('Could not create a secure download link. The link may have expired or there was a server error. Please try again.');
        }
    });
  }

  /**
   * Gathers the IDs of all selected candidates and triggers the download of a bulk
   * Excel report from the backend.
   */
  public triggerBulkDownload(): void {
    const selectedIds = this.sourcedCandidates
        .filter(c => c.selected)
        .map(c => c.candidate_id);

    if (selectedIds.length === 0) {
      alert('Please select at least one candidate to include in the report.');
      return;
    }

    if (!this.jobId) {
        alert('Cannot download report: No active Job ID.');
        return;
    }

    this.adminService.downloadSelectedReport(this.jobId, selectedIds).subscribe({
        next: (blob) => {
            // Create a temporary anchor element to trigger the file download
            const a = document.createElement('a');
            const objectUrl = URL.createObjectURL(blob);
            a.href = objectUrl;
            a.download = `candidate_report_job_${this.jobId}_selected.xlsx`;
            document.body.appendChild(a); // Append to body to ensure it's clickable
            a.click();
            URL.revokeObjectURL(objectUrl); // Clean up the object URL to free memory
            document.body.removeChild(a); // Remove the temporary element
        },
        error: (err) => {
            console.error('Report download failed', err);
            alert('Failed to download the report. Please try again.');
        }
    });
  }
}