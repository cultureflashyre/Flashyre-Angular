import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService
import { environment } from '../../../environments/environment';
@Component({
  selector: 'candidate-dashboard-main',
  templateUrl: 'candidate-dashboard-main.component.html',
  styleUrls: ['candidate-dashboard-main.component.css'],
})
export class CandidateDashboardMain {
  private baseUrl = environment.apiUrl;

  assessmentScore: string = 'N/A'; // Initialize score as 'N/A'

  constructor(
    private title: Title, 
    private meta: Meta, 
    private http: HttpClient, 
    private spinner: NgxSpinnerService
  ) {
    this.title.setTitle('Candidate-Dashboard-Main - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Candidate-Dashboard-Main - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }

  ngOnInit(): void {
    this.fetchAssessmentScore();
  }

  fetchAssessmentScore(): void {
    const assessmentId = 4;
    const url = `${this.baseUrl}assessment/get-assessment-score/${assessmentId}/`;

    // Show spinner before making the HTTP request
    this.spinner.show();

    this.http.get(url, {withCredentials: true}).subscribe({
      next: (response: any) => {
        if (response.score !== null) {
          this.assessmentScore = `${response.score}`;
        } else {
          this.assessmentScore = 'Not Available';
        }
      },
      error: (error) => {
        console.error('Error fetching assessment score:', error);
        this.assessmentScore = 'Failed to Load';
      },
      complete: () => {
        // Hide spinner after request completes
        this.spinner.hide();
      }
    });
  }
}