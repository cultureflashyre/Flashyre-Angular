// src/app/components/admin-page1-component/admin-page1-component.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminService, Candidate } from '../../services/admin.service';
import { forkJoin } from 'rxjs';

export interface DateFilter {
  label: string; 
  value: string; 
}

@Component({
  selector: 'admin-page1-component',
  templateUrl: 'admin-page1-component.component.html',
  styleUrls: ['admin-page1-component.component.css'],
  providers: [DatePipe] 
})
export class AdminPage1Component implements OnInit {
  @Input() rootClassName: string = '';

  public candidates: Candidate[] = [];
  public isLoading: boolean = true; 
  public isAllSelected: boolean = false;
  
  public dateFilters: DateFilter[] = [];
  public activeFilter: string | null = null; 

  constructor(
    private adminService: AdminService,
    private datePipe: DatePipe 
  ) {}

  ngOnInit(): void {
    // Call the public method on initialization
    this.refreshFiltersAndLoadLatest();
  }

  // --- MODIFIED: Renamed from 'initializeFiltersAndLoadData' to be a clear, public API method ---
  /**
   * This public method is the new entry point for loading or refreshing this component's data.
   * It fetches the latest batch dates, rebuilds the filter UI, and loads the candidates for the most recent date.
   * It can be safely called from parent components.
   */
  public refreshFiltersAndLoadLatest(): void {
    this.isLoading = true;
    this.adminService.getBatchDates().subscribe({
      next: (dates) => {
        if (dates && dates.length > 0) {
          this.generateDateFilters(dates);
          // Automatically apply the first filter (most recent date)
          this.applyFilter(this.dateFilters[0].value);
        } else {
          // Handle case where no CVs have ever been uploaded
          this.dateFilters = [];
          this.candidates = [];
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Failed to fetch batch dates:', err);
        alert('Could not load batch date information.');
        this.isLoading = false;
      }
    });
  }

  // This method remains private as it's an internal implementation detail
  private generateDateFilters(dates: string[]): void {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayStr = this.datePipe.transform(today, 'yyyy-MM-dd')!;
    const yesterdayStr = this.datePipe.transform(yesterday, 'yyyy-MM-dd')!;

    this.dateFilters = dates.map(dateStr => {
      let label = '';
      if (dateStr === todayStr) {
        label = 'Today';
      } else if (dateStr === yesterdayStr) {
        label = 'Yesterday';
      } else {
        label = this.datePipe.transform(dateStr, 'dd:MM:yy', 'UTC')!;
      }
      return { label: label, value: dateStr };
    });
  }

  // This should remain public as it's called from the template
  public fetchCandidates(dateFilter: string): void {
    this.isLoading = true;
    this.adminService.getCandidates(dateFilter).subscribe({
      next: (data) => {
        this.candidates = data.map(c => ({ ...c, selected: false }));
        this.isAllSelected = false;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch candidates:', err);
        alert('Could not load candidate data.');
        this.isLoading = false;
      },
    });
  }

  // This should remain public as it's called from the template
  public applyFilter(filterValue: string): void {
    this.activeFilter = filterValue;
    this.fetchCandidates(filterValue);
  }

  public toggleSelectAll(): void {
    this.candidates.forEach(c => c.selected = this.isAllSelected);
  }

  public updateSelectAllState(): void {
    this.isAllSelected = this.candidates.length > 0 && this.candidates.every(c => c.selected);
  }

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
          if(this.activeFilter) {
            this.applyFilter(this.activeFilter);
          }
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
          if(this.activeFilter) {
            this.applyFilter(this.activeFilter);
          }
        },
        error: (err) => {
          alert(`Failed to send invites: ${err.error?.message || 'Server error'}`);
        }
      });
    }
  }
}