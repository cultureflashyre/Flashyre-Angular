import { Component, Input, OnInit } from '@angular/core';
import { AdminService, Candidate } from '../../services/admin.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'admin-page1-component',
  templateUrl: 'admin-page1-component.component.html',
  styleUrls: ['admin-page1-component.component.css'],
})
export class AdminPage1Component implements OnInit {
  // ==============================================================================
  // CLASS PROPERTIES
  // ==============================================================================

  /** The root CSS class name passed from the parent component. */
  @Input()
  rootClassName: string = '';

  /** The array of candidate objects to be displayed in the template. */
  public candidates: Candidate[] = [];

  /** A flag to show a loading indicator while fetching data. */
  public isLoading = true;

  /** The state of the master "Select All" checkbox, bound with ngModel. */
  public selectAllState = false;

  // ==============================================================================
  // CONSTRUCTOR & LIFECYCLE HOOKS
  // ==============================================================================

  constructor(private adminService: AdminService) {}

  /**
   * A lifecycle hook that is called after Angular has initialized all data-bound properties.
   * Used here to perform the initial data load.
   */
  ngOnInit(): void {
    this.loadCandidates();
  }

  // ==============================================================================
  // DATA FETCHING METHODS
  // ==============================================================================

  /**
   * Fetches the list of candidates from the backend using the AdminService.
   * This is the primary method for populating the component's data.
   */
  public loadCandidates(): void {
    this.isLoading = true;
    // Defaulting to today's date for the filter. This can be made dynamic later.
    const today = new Date().toISOString().split('T')[0];

    this.adminService.getCandidates(today).subscribe({
      next: (data) => {
        // Add a 'selected' property to each candidate for UI checkbox binding.
        this.candidates = data.map(c => ({ ...c, selected: false }));
        this.isLoading = false;
        this.updateSelectAllState(); // Ensure 'Select All' is correctly unchecked.
      },
      error: (err) => {
        console.error("Failed to load candidates", err);
        this.isLoading = false;
      }
    });
  }

  // ==============================================================================
  // USER ACTION METHODS
  // ==============================================================================

  /**
   * Opens the candidate's CV file in a new browser tab.
   * @param cvUrl The URL of the CV file to open.
   */
  viewCv(cvUrl: string): void {
    if (cvUrl) {
      window.open(cvUrl, '_blank');
    }
  }

  /**
   * Deletes a single candidate after a confirmation prompt.
   * @param candidateId The ID of the candidate to delete.
   * @param index The index of the candidate in the local array for quick removal from the UI.
   */
  removeCandidate(candidateId: number, index: number): void {
    if (confirm('Are you sure you want to remove this candidate?')) {
      this.adminService.deleteCandidate(candidateId).subscribe({
        next: () => {
          this.candidates.splice(index, 1); // Remove from UI on success
          this.updateSelectAllState();
        },
        error: (err) => {
          alert('Failed to remove candidate. Please try again.');
          console.error(err);
        }
      });
    }
  }
  
  /**
   * Deletes all currently selected candidates after a confirmation prompt.
   * Uses forkJoin to handle multiple API requests in parallel.
   */
  removeSelected(): void {
    const selectedCandidates = this.candidates.filter(c => c.selected);
    if (selectedCandidates.length === 0) {
      alert('Please select at least one candidate to remove.');
      return;
    }

    if (confirm(`Are you sure you want to remove ${selectedCandidates.length} selected candidate(s)?`)) {
      const deleteObservables = selectedCandidates.map(candidate =>
        this.adminService.deleteCandidate(candidate.candidate_id).pipe(
          catchError(error => {
            console.error(`Failed to delete candidate ID ${candidate.candidate_id}`, error);
            // On failure, return the candidate object so we know which one failed.
            return of(candidate); 
          })
        )
      );

      // Explicitly type 'results' as 'any[]' to prevent the compilation error.
      forkJoin(deleteObservables).subscribe((results: any[]) => {
        // Filter out candidates whose IDs are NOT in the error results.
        const successfullyDeletedIds = selectedCandidates
          .filter(c => !results.some(res => res && res.candidate_id === c.candidate_id))
          .map(c => c.candidate_id);

        this.candidates = this.candidates.filter(
          c => !successfullyDeletedIds.includes(c.candidate_id)
        );
        
        if (results.length > successfullyDeletedIds.length) {
          alert('Some candidates could not be removed. Please check the console for details.');
        }

        this.updateSelectAllState();
      });
    }
  }

  /**
   * Sends registration emails to selected candidates who do not yet have an account.
   */
  startProcess(): void {
    const idsToSend = this.candidates
      .filter(c => c.selected && c.has_account === 'No' && c.account_creation_email_sent === 'No')
      .map(c => c.candidate_id);

    if (idsToSend.length === 0) {
      alert('Please select one or more new candidates (with a warning icon) to start the process.');
      return;
    }

    this.adminService.sendRegistrationInvites(idsToSend).subscribe({
      next: (response) => {
        alert(response.message || 'Invitations sent successfully!');
        this.loadCandidates(); // Refresh to show updated status.
      },
      error: (err) => {
        alert('Failed to send invitations. Please try again.');
        console.error(err);
      }
    });
  }

  // ==============================================================================
  // UI STATE HELPER METHODS
  // ==============================================================================

  /**
   * Toggles the 'selected' state of all candidates based on the master checkbox.
   */
  toggleSelectAll(): void {
    this.candidates.forEach(c => c.selected = this.selectAllState);
  }

  /**
   * Updates the state of the master 'Select All' checkbox. It should be checked
   * only if all individual candidate checkboxes are checked.
   */
  updateSelectAllState(): void {
    if (this.candidates.length === 0) {
      this.selectAllState = false;
      return;
    }
    this.selectAllState = this.candidates.every(c => c.selected);
  }
}