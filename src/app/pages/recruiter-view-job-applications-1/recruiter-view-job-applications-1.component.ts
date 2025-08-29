import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'recruiter-view-job-applications1',
  templateUrl: './recruiter-view-job-applications-1.component.html',
  styleUrls: ['./recruiter-view-job-applications-1.component.css'],
})
export class RecruiterViewJobApplications1 implements OnInit {
  job: any = null; // Store job data
  candidates: any[] = []; // Store first 5 candidates
  allCandidates: any[] = []; // Store all candidates
  moreCandidatesCount: number = 0; // Count of more candidates
  selectedTab: string = 'applied'; // Default tab
  appliedCount: number = 0;
  sourcedCount: number = 0;
  selectedCount: number = 0;
  masterChecked: boolean;

  constructor(
    private title: Title,
    private meta: Meta,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
    this.title.setTitle('Recruiter-View-Job-Applications-1 - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Recruiter-View-Job-Applications-1 - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  ngOnInit() {
    // Get job_id from URL (like /jobs/1)
    const jobId = this.route.snapshot.paramMap.get('jobId');
    this.fetchJobDetails(jobId);
  }

  fetchJobDetails(jobId: string | null) {
    if (jobId) {
      this.http
        .get(`http://127.0.0.1:8000/api/recruiter/jobs/${jobId}/applications/`)
        .subscribe(
          (data: any) => {
            this.job = data;
            this.candidates = data.applications; // First 5 candidates
            this.allCandidates = data.applications; // All candidates
            this.moreCandidatesCount = data.more_candidates;
            this.appliedCount = data.applied_count;
            this.sourcedCount = data.sourced_count;
            this.selectedCount = data.selected_count;
          },
          (error) => {
            console.error('Error fetching job details:', error);
          }
        );
    }
  }

  changeTab(tab: string) {
    this.selectedTab = tab;
    // Filter candidates based on tab
    this.candidates = this.allCandidates.filter(
      (candidate) => candidate.status === tab
    );
    // Show first 5 for the selected tab
    this.candidates = this.candidates.slice(0, 5);
    // Update more candidates count
    this.moreCandidatesCount = this.allCandidates.filter(
      (candidate) => candidate.status === tab
    ).length - this.candidates.length;
  }
   
  toggleAll(checked: boolean) {
  this.masterChecked = checked;
  const newStatus = checked ? 'selected' : 'applied';
  this.candidates.forEach(candidate => {
    this.updateCandidateStatus(candidate.application_id, newStatus);
  });
  // Refresh tab when unchecking in Selected view
  if (!checked && this.selectedTab === 'selected') {
    this.changeTab(this.selectedTab);
  }
}

updateMasterChecked() {
  this.masterChecked = this.candidates.every(candidate => candidate.status === 'selected');
}

  loadMoreCandidates() {
    // Load all candidates for the current tab
    this.candidates = this.allCandidates.filter(
      (candidate) => candidate.status === this.selectedTab
    );
    this.moreCandidatesCount = 0; // No more to load
  }

  updateCandidateStatus(applicationId: string, newStatus: string) {
  const candidate = this.allCandidates.find(
    (c) => c.application_id === applicationId
  );
  if (candidate) {
    candidate.status = newStatus;
    this.appliedCount = this.allCandidates.filter(
      (c) => c.status === 'applied'
    ).length;
    this.sourcedCount = this.allCandidates.filter(
      (c) => c.status === 'sourced'
    ).length;
    this.selectedCount = this.allCandidates.filter(
      (c) => c.status === 'selected'
    ).length;
    this.updateMasterChecked();
    // Refresh tab only in Selected view when status changes to non-selected
    if (this.selectedTab === 'selected' && newStatus !== 'selected') {
      this.changeTab(this.selectedTab);
    }
  }
}
}