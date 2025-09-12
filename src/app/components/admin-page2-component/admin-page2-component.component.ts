// src/app/components/admin-page2-component/admin-page2-component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
// --- FIX 1: Import RxJS operators from the correct path ---
import { takeUntil } from 'rxjs/operators';
// --- END FIX 1 ---
import { AdminService, JobDescription } from '../../services/admin.service';

@Component({
  selector: 'admin-page2-component',
  templateUrl: 'admin-page2-component.component.html',
  styleUrls: ['admin-page2-component.component.css'],
})
export class AdminPage2Component implements OnInit, OnDestroy {
  public activeView: 'jd' | 'candidates' = 'jd';
  public candidateFilter: string = 'all';
  public candidateFilterDisplay: string = 'Candidate Sourced';
  public latestJd$: Observable<JobDescription | null>;
  
  public activeJobId: number | null = null;
  
  @Input() rootClassName: string = '';

  private destroy$ = new Subject<void>();

  constructor(private adminService: AdminService) {
    this.latestJd$ = this.adminService.activeJd$;
  }

  ngOnInit(): void {
    this.latestJd$.pipe(
      takeUntil(this.destroy$)
    // --- FIX 2: Explicitly type the 'jd' parameter to guide the compiler ---
    ).subscribe((jd: JobDescription | null) => {
    // --- END FIX 2 ---
        if (jd) {
            // The type guard now works as expected, and 'jd.job_id' is safe to access.
            this.activeJobId = jd.job_id;
        } else {
            this.activeJobId = null;
        }
    });
  }

  public showJdView(): void {
    this.activeView = 'jd';
  }

  public showCandidatesView(filter: string, filterDisplay: string): void {
    this.activeView = 'candidates';
    this.candidateFilter = filter;
    this.candidateFilterDisplay = filterDisplay;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}