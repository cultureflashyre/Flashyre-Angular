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
  job: any = null;
  candidates: any[] = [];
  allCandidates: any[] = [];
  moreCandidatesCount: number = 0;
  selectedTab: string = 'applied';
  appliedCount: number = 0;
  sourcedCount: number = 0;
  screeningCount: number = 0;
  assessmentCount: number = 0;
  interviewCount: number = 0;
  selectedIds = new Set<string>();


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
          console.log('API Response:', data);
          this.job = data;
          this.allCandidates = data.applications;
          this.appliedCount = data.applied_count;
          this.sourcedCount = data.sourced_count;
          this.screeningCount = data.screening_count;
          this.assessmentCount = data.assessment_count;
          this.interviewCount = data.interview_count;
          this.changeTab('applied');
        },
        (error) => {
          console.error('Error fetching job details:', error);
        }
      );
  }
}

  recalculateCounts() {
  this.appliedCount = this.allCandidates.filter((c) => c.status === 'applied').length;
  this.sourcedCount = this.allCandidates.filter((c) => c.status === 'sourced').length;
  this.screeningCount = this.allCandidates.filter((c) => c.status === 'screening').length;
  this.assessmentCount = this.allCandidates.filter((c) => c.status === 'assessment').length;
  this.interviewCount = this.allCandidates.filter((c) => c.status === 'interview').length;
}

  changeTab(tab: string) {
  this.selectedTab = tab;
  this.selectedIds.clear();
  const filtered = this.allCandidates.filter((candidate) => candidate.status === tab);
  this.candidates = filtered.slice(0, 5);
  this.moreCandidatesCount = filtered.length - this.candidates.length;
}

  areAllSelected(): boolean {
    return this.candidates.every((c) => this.selectedIds.has(c.application_id));
  }

  toggleAll(checked: boolean) {
    this.candidates.forEach((c) => {
      if (checked) {
        this.selectedIds.add(c.application_id);
      } else {
        this.selectedIds.delete(c.application_id);
      }
    });
  }

  onCheckboxChange(id: string, checked: boolean) {
    if (checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
  }

  loadMoreCandidates() {
    const filtered = this.allCandidates.filter((candidate) => candidate.status === this.selectedTab);
    this.candidates = filtered;
    this.moreCandidatesCount = 0;
  }

  sendInvite(inviteType: 'screening' | 'assessment' | 'interview') {
    const jobId = this.route.snapshot.paramMap.get('jobId');
    if (this.selectedIds.size === 0) {
      alert('Please select at least one candidate.');
      return;
    }

    const applicationIds = Array.from(this.selectedIds);

    this.http
      .post(`http://127.0.0.1:8000/api/recruiter/jobs/${jobId}/send-invites/`, {
        application_ids: applicationIds,
        invite_type: inviteType,
      })
      .subscribe(
        (response) => {
          console.log(`${inviteType} invites sent successfully`);
          // Update local statuses to move candidates
          const newStatus = inviteType;
          this.allCandidates.forEach((c) => {
            if (this.selectedIds.has(c.application_id)) {
              c.status = newStatus;
            }
          });
          this.selectedIds.clear();
          this.recalculateCounts();
          this.changeTab(this.selectedTab);  // Refresh to remove moved candidates
          alert(`${inviteType.charAt(0).toUpperCase() + inviteType.slice(1)} invites sent successfully.`);
        },
        (error) => {
          console.error(`Error sending ${inviteType} invites:`, error);
          alert(`Failed to send ${inviteType} invites. Please try again.`);
        }
      );
  }

  openCV(url: string): void {
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('No CV available for this candidate.');
    }
  }
}