import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminService, JobDescription } from '../../services/admin.service'; // Adjust path if needed

@Component({
  selector: 'admin-page2-component',
  templateUrl: 'admin-page2-component.component.html',
  styleUrls: ['admin-page2-component.component.css'],
})
export class AdminPage2Component implements OnInit {
  // --- NEW: Component State ---
  public activeView: 'jd' | 'candidates' = 'jd'; // Default to 'JD Extracted'
  public candidateFilter: string = 'all'; // Default filter for candidates
  public candidateFilterDisplay: string = 'All Candidates'; // Text to show on the dropdown button
  public latestJd$: Observable<JobDescription | null>;

  // Kept for template compatibility if needed, but logic is handled by new state
  @Input() rootClassName: string = '';

  constructor(private adminService: AdminService) {
    this.latestJd$ = this.adminService.activeJd$;
  }

  ngOnInit(): void {
    // Service constructor already calls getLatestJd, so the data will be available via the activeJd$ observable.
  }

  // --- NEW: Methods to control the view and filters ---
  public showJdView(): void {
    this.activeView = 'jd';
  }

  public showCandidatesView(filter: string, filterDisplay: string): void {
    this.activeView = 'candidates';
    this.candidateFilter = filter;
    this.candidateFilterDisplay = filterDisplay;
  }
}