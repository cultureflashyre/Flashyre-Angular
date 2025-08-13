import { Component, Input, OnInit } from '@angular/core';
import { AdminService, Candidate } from '../../services/admin.service'; // Adjust path if needed
import { forkJoin } from 'rxjs';

@Component({
  selector: 'admin-page1-component',
  templateUrl: 'admin-page1-component.component.html',
  styleUrls: ['admin-page1-component.component.css'],
})
export class AdminPage1Component implements OnInit {
  @Input() rootClassName: string = '';

  // --- NEW: Component State ---
  public candidates: Candidate[] = [];
  public isLoading: boolean = false;
  public isAllSelected: boolean = false;
  public activeFilter: string = 'today';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.fetchCandidates();
  }

  // --- NEW: Data Fetching and Filtering ---
  public fetchCandidates(dateFilter?: string): void {
    this.isLoading = true;
    this.adminService.getCandidates(dateFilter).subscribe({
      next: (data) => {
        // Initialize each candidate with a 'selected' property for checkbox binding
        this.candidates = data.map(c => ({ ...c, selected: false }));
        this.isAllSelected = false; // Reset selection state on new data
      },
      error: (err) => {
        console.error('Failed to fetch candidates:', err);
        alert('Could not load candidate data.');
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  public applyFilter(filter: string, date?: string): void {
    this.activeFilter = filter;
    let dateString: string | undefined;

    if (filter === 'today') {
      dateString = this.getFormattedDate(new Date());
    } else if (filter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      dateString = this.getFormattedDate(yesterday);
    } else if (filter === 'custom' && date) {
      // Logic for a custom date picker would go here
      // For now, we assume 'date' is a valid 'YYYY-MM-DD' string
      dateString = date;
    }
    
    this.fetchCandidates(dateString);
  }

  private getFormattedDate(d: Date): string {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }


  // --- NEW: Selection Logic ---
  public toggleSelectAll(): void {
    this.candidates.forEach(c => c.selected = this.isAllSelected);
  }

  public updateSelectAllState(): void {
    this.isAllSelected = this.candidates.length > 0 && this.candidates.every(c => c.selected);
  }

  // --- NEW: Action Handlers ---
  public removeCandidate(id: number, index: number): void {
    if (confirm('Are you sure you want to remove this candidate? This action cannot be undone.')) {
      this.adminService.deleteCandidate(id).subscribe({
        next: () => {
          this.candidates.splice(index, 1);
          this.updateSelectAllState();
          alert('Candidate removed successfully.');
        },
        error: (err) => {
          alert(`Failed to remove candidate: ${err.error?.detail || 'Server error'}`);
        }
      });
    }
  }

  public removeSelected(): void {
    const selectedIds = this.candidates.filter(c => c.selected).map(c => c.candidate_id);
    if (selectedIds.length === 0) {
      alert('Please select at least one candidate to remove.');
      return;
    }

    if (confirm(`Are you sure you want to permanently delete ${selectedIds.length} candidate(s)?`)) {
      const deleteObservables = selectedIds.map(id => this.adminService.deleteCandidate(id));
      forkJoin(deleteObservables).subscribe({
        next: () => {
          alert('Selected candidates removed successfully.');
          // Refresh the list from the server to get the clean state
          this.applyFilter(this.activeFilter);
        },
        error: (err) => {
          alert(`An error occurred while removing candidates: ${err.message}`);
        }
      });
    }
  }

  public startProcess(): void {
    const selectedCandidates = this.candidates.filter(c => c.selected);
    if (selectedCandidates.length === 0) {
      alert('Please select at least one candidate to start the process.');
      return;
    }

    const unregisteredIds = selectedCandidates
      .filter(c => c.has_account !== 'Yes')
      .map(c => c.candidate_id);

    const hasRegistered = selectedCandidates.some(c => c.has_account === 'Yes');

    if (unregisteredIds.length === 0) {
      alert('All selected candidates are already registered.');
      return;
    }

    let confirmationMessage = `This will send registration invites to ${unregisteredIds.length} unregistered candidate(s). Proceed?`;
    if (hasRegistered) {
      confirmationMessage = 'Some selected candidates are already registered. ' + confirmationMessage;
    }

    if (confirm(confirmationMessage)) {
      this.adminService.sendRegistrationInvites(unregisteredIds).subscribe({
        next: (response) => {
          alert(response.message);
          // Optionally, refresh to show updated email sent status
          this.applyFilter(this.activeFilter);
        },
        error: (err) => {
          alert(`Failed to send invites: ${err.error?.message || 'Server error'}`);
        }
      });
    }
  }
}