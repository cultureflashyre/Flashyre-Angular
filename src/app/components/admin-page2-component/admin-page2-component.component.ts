// src/app/components/admin-page2-component/admin-page2-component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common'; // --- NEW: Import DatePipe ---
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminService, JobDescription } from '../../services/admin.service';

// --- NEW: Interface for our dynamic filter objects ---
export interface CandidateFilter {
  label: string; // The text to display in the dropdown (e.g., 'All Candidates', 'Today')
  value: string; // The value to be used by the logic (e.g., 'all', '2025-09-16')
}

@Component({
  selector: 'admin-page2-component',
  templateUrl: 'admin-page2-component.component.html',
  styleUrls: ['admin-page2-component.component.css'],
  providers: [DatePipe] // --- NEW: Add DatePipe to the component's providers ---
})
export class AdminPage2Component implements OnInit, OnDestroy {
  // --- MODIFIED: State Properties ---
  public activeView: 'jd' | 'candidates' = 'jd';
  public candidateFilterValue: string = 'all'; // Holds the actual filter value for logic
  public candidateFilterDisplay: string = 'Candidate Sourced'; // Holds the text for the dropdown button
  public latestJd$: Observable<JobDescription | null>;
  public activeJobId: number | null = null;
  
  // --- NEW: Property to hold the dynamically generated dropdown items ---
  public candidateFilters: CandidateFilter[] = [];
  
  @Input() rootClassName: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private adminService: AdminService,
    private datePipe: DatePipe // --- NEW: Inject DatePipe ---
  ) {
    this.latestJd$ = this.adminService.activeJd$;
  }

  ngOnInit(): void {
    // Subscribe to JD updates to get the activeJobId
    this.latestJd$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((jd: JobDescription | null) => {
        if (jd) {
            this.activeJobId = jd.job_id;
        } else {
            this.activeJobId = null;
        }
    });

    // --- NEW: Fetch batch dates to build the dynamic filters ---
    this.initializeCandidateFilters();
  }

  // --- NEW: Method to fetch dates and generate filter objects ---
  private initializeCandidateFilters(): void {
    this.adminService.getBatchDates().subscribe({
      next: (dates) => {
        this.generateCandidateFilters(dates);
      },
      error: (err) => {
        console.error('Failed to fetch batch dates for filters:', err);
        // Even on error, provide the default "All Candidates" option
        this.candidateFilters = [{ label: 'All Candidates', value: 'all' }];
      }
    });
  }

  // --- NEW: Private helper to transform date strings into filter objects ---
  private generateCandidateFilters(dates: string[]): void {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayStr = this.datePipe.transform(today, 'yyyy-MM-dd')!;
    const yesterdayStr = this.datePipe.transform(yesterday, 'yyyy-MM-dd')!;
    
    // Start with the static "All Candidates" option
    const filters: CandidateFilter[] = [{ label: 'All Candidates', value: 'all' }];

    // Generate a filter for each unique batch date
    dates.forEach(dateStr => {
      let label = '';
      if (dateStr === todayStr) {
        label = 'Today';
      } else if (dateStr === yesterdayStr) {
        label = 'Yesterday';
      } else {
        // Format date as 'dd:MM:yy' as requested
        label = this.datePipe.transform(dateStr, 'dd:MMM:yy', 'UTC')!;
      }
      filters.push({ label, value: dateStr });
    });

    this.candidateFilters = filters;
  }
  
  public showJdView(): void {
    this.activeView = 'jd';
  }

  // --- MODIFIED: This method now sets the state based on the selected filter object ---
  public showCandidatesView(value: string, displayLabel: string): void {
    this.activeView = 'candidates';
    this.candidateFilterValue = value;
    this.candidateFilterDisplay = displayLabel;
    // NOTE: A child component would now consume `candidateFilterValue` to perform the actual filtering.
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}