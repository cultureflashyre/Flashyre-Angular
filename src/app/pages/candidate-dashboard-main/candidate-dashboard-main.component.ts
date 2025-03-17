import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'candidate-dashboard-main',
  templateUrl: 'candidate-dashboard-main.component.html',
  styleUrls: ['candidate-dashboard-main.component.css'],
})
export class CandidateDashboardMain {
  assessmentScore: string = 'N/A'; // Initialize score as 'N/A'

  constructor(private title: Title, private meta: Meta, private http: HttpClient) {
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
    const assessmentId = 10;
    const url = `http://localhost:8000/assessment/get-assessment-score/${assessmentId}/`;

    this.http.get(url, {withCredentials: true}).subscribe({
      next: (response: any) => {
        if (response.score !== null) {
          this.assessmentScore = `${response.score}/100`;
        } else {
          this.assessmentScore = 'Not Available';
        }
      },
      error: (error) => {
        console.error('Error fetching assessment score:', error);
        this.assessmentScore = 'Failed to Load';
      },
    });
  }
}