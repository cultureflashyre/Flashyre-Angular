import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, tap, throwError, finalize, of } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../environments/environment';

// <--- MODIFICATION START --->
// Define an interface for a single section object
interface Section {
  name: string;
  section_id: number | null;
  duration_per_section: number;
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
}

interface TrialAssessmentResponse {
  attempts_allowed: number;
  attempts_remaining: number;
  assessment_id: number;
  assessment_title: string;
  proctored: string;
  allow_mobile: string;
  video_recording: string;
  total_assessment_duration: number;
  sections: Section[]; // Changed from a dictionary to an array of Section objects
}
// <--- MODIFICATION END --->


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

// In trial-assessment.service.ts

getAssessmentDetails(assessmentId: number): Observable<any> { // Return Observable<any> since shape varies
  this.spinner.show();
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
  const url = `${environment.apiUrl}trial_assessments/?assessment_id=${assessmentId}`;
  
  console.log(`DEBUG: [Service] Making GET request to: ${url}`);

  return this.http.get<any>(url, { headers }).pipe( // Expect 'any' type now
    // This 'tap' will run for ANY successful (2xx) response from the backend
    tap(response => {
      console.log('DEBUG: [Service] Received SUCCESSFUL response from API (2xx status). Passing to component.', response);
    }),
    catchError((error: HttpErrorResponse) => {
      // This will now ONLY run for real errors (4xx, 5xx, network failure)
      console.error('DEBUG: [Service] Caught a REAL HTTP ERROR.', error);
      
      // We no longer need the special 403 check here because the backend sends 200 OK.
      // Just pass the original error along to the component's error block.
      return throwError(() => error);
    }),
    finalize(() => {
      console.log('DEBUG: [Service] Finalize block executed. Hiding spinner.');
      this.spinner.hide();
    })
  );
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
    // Add 'coding/' to the path
    return this.http.post(`${environment.apiUrl}api/coding/run/`, data);
}

submitCode(data: { problem_id: number, source_code: string, language_id: number }): Observable<any> {
    // Add 'coding/' to the path
    return this.http.post(`${environment.apiUrl}api/coding/submissions/`, data);
}
}