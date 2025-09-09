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
  filteredAndSortedCandidates: any[] = [];
  moreCandidatesCount: number = 0;
  selectedTab: string = 'applied';
  masterChecked: boolean = false;
  jobId: string | null;

  appliedCount: number = 0;
  screeningCount: number = 0;
  assessmentCount: number = 0;
  interviewCount: number = 0;

  sortColumn: string = 'name';
  sortDirection: string = 'asc';

  searchJobTitle: string = '';
  searchLocation: string = '';
  searchExperience: string = '';

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
    this.jobId = this.route.snapshot.paramMap.get('jobId');
    this.fetchJobDetails();
  }

  fetchJobDetails() {
    if (this.jobId) {
      this.http
        .get(`http://127.0.0.1:8000/api/recruiter/jobs/${this.jobId}/applications/`)
        .subscribe(
          (data: any) => {
            this.job = data;
            this.allCandidates = data.applications.map(c => ({...c, isSelected: false }));
            
            this.appliedCount = data.applied_count;
            this.screeningCount = data.screening_count;
            this.assessmentCount = data.assessment_count;
            this.interviewCount = data.interview_count;
            
            this.applyFiltersAndSorting();
            this.masterChecked = false;
          },
          (error) => {
            console.error('Error fetching job details:', error);
          }
        );
    }
  }

  changeTab(tab: string) {
    this.selectedTab = tab;
    this.masterChecked = false;
    this.applyFiltersAndSorting();
  }

  sortData(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSorting();
  }

  onSearchClick() {
    this.applyFiltersAndSorting();
  }

  applyFiltersAndSorting() {
    let results = [...this.allCandidates];

    // 1. Apply Search Filters
    if (this.searchJobTitle.trim()) {
      const searchTerm = this.searchJobTitle.toLowerCase().trim();
      results = results.filter(candidate =>
        candidate.designation && candidate.designation.toLowerCase().includes(searchTerm)
      );
    }

    // 2. Filter based on the selected tab
    let tabFilteredResults = results;
    if (this.selectedTab !== 'applied') {
        let statusFilter: string;
        switch (this.selectedTab) {
            case 'screening': statusFilter = 'Screening'; break;
            case 'assessment': statusFilter = 'Assessment'; break;
            case 'interview': statusFilter = 'Interview'; break;
        }
        tabFilteredResults = results.filter(c => c.status === statusFilter);
    }

    // 3. Sort the filtered list
    tabFilteredResults.sort((a, b) => {
      const isAsc = this.sortDirection === 'asc';
      let comparison = 0;

      switch (this.sortColumn) {
        case 'name':
          comparison = a.user.full_name.localeCompare(b.user.full_name);
          break;
        case 'score':
          comparison = a.matching_score - b.matching_score;
          break;
        case 'status':
          const statusOrder = { 'applied': 1, 'Screening': 2, 'Assessment': 3, 'Interview': 4 };
          const orderA = statusOrder[a.status] || 99;
          const orderB = statusOrder[b.status] || 99;
          comparison = orderA - orderB;
          break;
      }
      return comparison * (isAsc ? 1 : -1);
    });

    this.filteredAndSortedCandidates = tabFilteredResults;

    // 4. Apply pagination
    this.candidates = this.filteredAndSortedCandidates.slice(0, 5);
    this.moreCandidatesCount = this.filteredAndSortedCandidates.length - this.candidates.length;
  }

  toggleAll(checked: boolean) {
    this.masterChecked = checked;
    this.candidates.forEach(candidate => candidate.isSelected = checked);
  }

  onCheckboxChange(candidate: any, isChecked: boolean) {
    candidate.isSelected = isChecked;
    this.updateMasterChecked();
  }

  updateMasterChecked() {
    if (this.candidates.length === 0) {
        this.masterChecked = false;
    } else {
        this.masterChecked = this.candidates.every(c => c.isSelected);
    }
  }

  loadMoreCandidates() {
    this.candidates = this.filteredAndSortedCandidates;
    this.moreCandidatesCount = 0;
  }

  sendInvite() {
    const selectedCandidates = this.allCandidates.filter(c => c.isSelected);

    if (selectedCandidates.length === 0) {
      alert('Please select at least one candidate to send an invite.');
      return;
    }

    const applicationIds = selectedCandidates.map(c => c.application_id);
    let inviteType: string;

    switch (this.selectedTab) {
      case 'applied':
        inviteType = 'screening';
        break;
      case 'screening':
        inviteType = 'assessment';
        break;
      case 'assessment':
        inviteType = 'interview';
        break;
      default:
        console.error('No invite action for this tab.');
        return;
    }

    this.http
      .post(`http://127.0.0.1:8000/api/recruiter/jobs/${this.jobId}/send-invites/`, {
        application_ids: applicationIds,
        invite_type: inviteType,
      })
      .subscribe(
        (response: any) => {
          this.appliedCount = response.applied_count;
          this.screeningCount = response.screening_count;
          this.assessmentCount = response.assessment_count;
          this.interviewCount = response.interview_count;

          selectedCandidates.forEach(candidate => {
            const found = this.allCandidates.find(c => c.application_id === candidate.application_id);
            if (found) {
                found.status = {
                  'screening': 'Screening',
                  'assessment': 'Assessment',
                  'interview': 'Interview'
                }[inviteType];
                found.isSelected = false;
            }
          });

          this.applyFiltersAndSorting();
          this.masterChecked = false;
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