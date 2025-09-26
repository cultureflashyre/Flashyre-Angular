import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../environments/environment';

interface TrialAssessmentResponse {
  attempts_allowed: number;
  attempts_remaining: number;
  assessment_id: number;
  assessment_title: string;
  proctored: string;
  allow_mobile: string;
  video_recording: string;
  total_assessment_duration: number;
  sections: {
    [sectionName: string]: {
      section_id: number | null;
      duration: number;
      questions: {
        question_id: number;
        question: string;
        question_image: string | null;
        option_type: string;
        options: {
          option1: string;
          q_option1_image: string | null;
          option2: string;
          q_option2_image: string | null;
          option3?: string;
          q_option3_image: string | null;
          option4?: string;
          q_option4_image: string | null;
        };
      }[];
      coding_problem?: {
        id: number;
        title: string;
        description: string;
        input_format: string;
        output_format: string;
        constraints: string;
        example: string;
        timer: number;
        test_cases: { input: string; expected_output: string }[];
      } | null;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class TrialAssessmentService {
  private timerSource = new BehaviorSubject<number>(0);
  public timer$ = this.timerSource.asObservable();

  constructor(
    private http: HttpClient,
    private spinner: NgxSpinnerService
  ) { }

  updateTimer(time: number) {
    this.timerSource.next(time);
  }

  getAssessmentDetails(assessmentId: number): Observable<TrialAssessmentResponse> {
    this.spinner.show();
    const token = localStorage.getItem('token');
    console.log('Using token:', token ? 'Token exists' : 'No token found');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    const url = `${environment.apiUrl}trial_assessments/?assessment_id=${assessmentId}`;
    console.log('Making request to:', url);
    return new Observable<TrialAssessmentResponse>((observer) => {
      this.http.get<TrialAssessmentResponse>(url, { headers }).subscribe({
        next: (response) => {
          console.log('API Response:', response);
          this.spinner.hide();
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('API Error details:', error);
          this.spinner.hide();
          observer.error(error);
        }
      });
    });
  }

  submitAssessment(data: any): Observable<any> {
    this.spinner.show();
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return new Observable((observer) => {
      this.http.post(`${environment.apiUrl}submit-assessment/`, data, { headers }).subscribe({
        next: (response) => {
          this.spinner.hide();
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          this.spinner.hide();
          observer.error(error);
        }
      });
    });
  }

  getProblem(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(`${environment.apiUrl}problems/${id}`, { headers });
  }

    runCode(data: { problem_id: number, source_code: string, language_id: number }): Observable<any> {
    return this.http.post('http://localhost:8000/api/' + 'run', data);
  }

  submitCode(data: { problem_id: number, source_code: string, language_id: number }): Observable<any> {
    return this.http.post('http://localhost:8000/api/' + 'submissions', data);
  }
}