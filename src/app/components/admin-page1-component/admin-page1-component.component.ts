import { Component, Input, OnInit } from '@angular/core';
import { AdminService, Candidate } from '../../services/admin.service';
import { forkJoin, of } from 'rxjs'; // Import forkJoin for handling multiple requests
import { catchError } from 'rxjs/operators'; // Import catchError for better error handling

@Component({
  selector: 'admin-page1-component',
  templateUrl: 'admin-page1-component.component.html',
  styleUrls: ['admin-page1-component.component.css'],
})
export class AdminPage1Component implements OnInit {
  @Input()
  rootClassName: string = '';

  public candidates: Candidate[] = [];
  public isLoading = true;
  public selectAllState = false;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadCandidates();
  }

  public loadCandidates(): void {
    this.isLoading = true;
    const today = new Date().toISOString().split('T')[0];

    this.adminService.getCandidates(today).subscribe({
      next: (data) => {
        this.candidates = data.map(c => ({ ...c, selected: false }));
        this.isLoading = false;
        this.updateSelectAllState();
      },
      error: (err) => {
        console.error("Failed to load candidates", err);
        this.isLoading = false;
      }
    });
  }

  viewCv(cvUrl: string): void {
    if (cvUrl) {
      window.open(cvUrl, '_blank');
    }
  }

  removeCandidate(candidateId: number, index: number): void {
    if (confirm('Are you sure you want to remove this candidate?')) {
      this.adminService.deleteCandidate(candidateId).subscribe({
        next: () => {
          this.candidates.splice(index, 1);
          this.updateSelectAllState(); // Update select all state after removal
        },
        error: (err) => {
          alert('Failed to remove candidate. Please try again.');
          console.error(err);
        }
      });
    }
  }
  
  /**
   * [FIXED] Implements the logic to remove all selected candidates.
   */
  removeSelected(): void {
    const selectedCandidates = this.candidates.filter(c => c.selected);
    if (selectedCandidates.length === 0) {
      alert('Please select at least one candidate to remove.');
      return;
    }

    if (confirm(`Are you sure you want to remove ${selectedCandidates.length} selected candidate(s)?`)) {
      // Create an array of delete observables
      const deleteObservables = selectedCandidates.map(candidate =>
        this.adminService.deleteCandidate(candidate.candidate_id).pipe(
          // If one request fails, we still want to know which one, but not fail the whole batch
          catchError(error => {
            console.error(`Failed to delete candidate ID ${candidate.candidate_id}`, error);
            // Return an observable of the failed candidate so we can identify it
            return of(candidate); 
          })
        )
      );

      // forkJoin executes all observables in parallel
      forkJoin(deleteObservables).subscribe(results => {
        // Get IDs of candidates that were successfully deleted (i.e., didn't return an error)
        const successfullyDeletedIds = selectedCandidates
          .filter(c => !results.some(res => res && res.candidate_id === c.candidate_id))
          .map(c => c.candidate_id);

        // Update the UI by filtering out the successfully deleted candidates
        this.candidates = this.candidates.filter(
          c => !successfullyDeletedIds.includes(c.candidate_id)
        );
        
        if (results.length > successfullyDeletedIds.length) {
          alert('Some candidates could not be removed. Please check the console for errors.');
        }

        this.updateSelectAllState(); // Refresh the select all checkbox state
      });
    }
  }

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
        this.loadCandidates();
      },
      error: (err) => {
        alert('Failed to send invitations. Please try again.');
        console.error(err);
      }
    });
  }

  toggleSelectAll(): void {
    this.candidates.forEach(c => c.selected = this.selectAllState);
  }

  updateSelectAllState(): void {
    if (this.candidates.length === 0) {
      this.selectAllState = false;
      return;
    }
    this.selectAllState = this.candidates.every(c => c.selected);
  }
}