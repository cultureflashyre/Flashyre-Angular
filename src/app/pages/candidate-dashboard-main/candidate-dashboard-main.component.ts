import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'candidate-dashboard-main',
  templateUrl: 'candidate-dashboard-main.component.html',
  styleUrls: ['candidate-dashboard-main.component.css'],
})
export class CandidateDashboardMain {
  private baseUrl = environment.apiUrl;
  assessments: any[] = [];

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
    this.fetchAllAssessmentScores();
  }

  fetchAllAssessmentScores(): void {
    const url = `${this.baseUrl}assessment/get-all-assessment-scores/`;
    this.spinner.show();
    this.http.get(url, {withCredentials: true}).subscribe({
      next: (response: any) => {
        this.assessments = response.map((item: any) => ({
          assessment_id: item.assessment_id,
          assessment_name: item.assessment_name,
          score: item.score !== null ? `${item.score}` : 'Not Available',
          end_time: item.end_time
        }));
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error fetching assessment scores:', error);
        this.assessments = [];
        this.spinner.hide();
      },
    });
  }
}