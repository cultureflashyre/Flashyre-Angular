import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { AdminService, SourcedCandidate, JobDescription } from '../../services/admin.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'admin-candidate-sourced-component',
  templateUrl: 'admin-candidate-sourced-component.component.html',
  styleUrls: ['admin-candidate-sourced-component.component.css'],
})
export class AdminCandidateSourcedComponent implements OnInit, OnDestroy {
  @Input() rootClassName: string = '';

  public candidates: SourcedCandidate[] = [];
  public isLoading = false;
  public activeJd: JobDescription | null = null;
  private jdSubscription: Subscription;
  
  public sortBy = 'score_desc'; // Default sort option
  public sortOptions = [
    { value: 'score_desc', label: 'Score: High to Low' },
    { value: 'score_asc', label: 'Score: Low to High' },
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' },
  ];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.jdSubscription = this.adminService.activeJd$.subscribe(latestJd => {
      this.activeJd = latestJd;
      if (this.activeJd) {
        this.fetchSourcedCandidates();
      } else {
        this.candidates = []; // Clear candidates if no JD is active
      }
    });
  }

  ngOnDestroy(): void {
    if (this.jdSubscription) {
      this.jdSubscription.unsubscribe();
    }
  }

  fetchSourcedCandidates(): void {
    if (!this.activeJd) return;

    this.isLoading = true;
    this.adminService.getSourcedCandidates(this.activeJd.job_id, this.sortBy).subscribe({
      next: (data) => {
        this.candidates = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Failed to load sourced candidates", err);
        this.isLoading = false;
      }
    });
  }
  
  onSortChange(): void {
    this.fetchSourcedCandidates();
  }

  viewCv(cvUrl: string): void {
    if (cvUrl) window.open(cvUrl, '_blank');
  }

  downloadCv(cvUrl: string, candidateName: string): void {
    // This is a simple version. A robust version would use HttpClient to fetch
    // the blob and create an ObjectURL to handle CORS issues if any.
    const link = document.createElement('a');
    link.href = cvUrl;
    link.target = '_blank';
    // Try to suggest a filename
    const filename = cvUrl.split('/').pop() || `${candidateName}_CV.pdf`;
    link.download = filename;
    link.click();
  }

  downloadReport(): void {
    if (!this.activeJd) return;

    this.adminService.downloadCandidateReport(this.activeJd.job_id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `candidate_report_job_${this.activeJd?.job_id}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => console.error('Report download failed', err)
    });
  }
}