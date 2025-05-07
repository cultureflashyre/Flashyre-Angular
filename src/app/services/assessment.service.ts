





import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService
import { environment } from '../../environments/environment';
interface AssessmentResponse {
  assessment_id: number;
  assessment_title: string;
  proctored: string;
  allow_mobile: string;
  video_recording: string;
  total_assessment_duration: number;
  sections: {
    [sectionName: string]: {
      section_id: number;
      duration: number;
      questions: {
        question_id: number;
        question: string;
        question_image: string | null;
        option_type: string;
        options: {
          option1: string;
          option2: string;
          option3?: string;
          option4?: string;
        };
      }[];
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {

  private apiUrl = environment.apiUrl+'assessments'; // Replace with your server URL
  private timerSource = new BehaviorSubject<number>(0);
  public timer$ = this.timerSource.asObservable();

  constructor(
    private http: HttpClient,
    private spinner: NgxSpinnerService
  ) { }

  // Fetch assessment data including sections, questions, and timer duration
  //getAssessmentData(assessmentId: number): Observable<AssessmentResponse> {
    //return this.http.get<AssessmentResponse>(`${this.apiUrl}/?assessment_id=${assessmentId}`, { withCredentials: true });
  //}

  getAssessmentData(assessmentId: number): Observable<AssessmentResponse> {
    this.spinner.show(); // Show spinner before making the request

    return new Observable<AssessmentResponse>((observer) => {
      this.http.get<AssessmentResponse>(`${this.apiUrl}/?assessment_id=${assessmentId}`)
        .subscribe({
          next: (response) => {
            this.spinner.hide(); // Hide spinner on successful response
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            this.spinner.hide(); // Hide spinner on error
            observer.error(error);
          }
        });
    });
  }

  // Update timer value
  updateTimer(time: number) {
    this.timerSource.next(time);
  }

  // Submit assessment answers
  //submitAssessment(answers: any): Observable<any> {
    //return this.http.post(`${this.apiUrl}/submit-assessment/`, answers, { withCredentials: true });
  //}

  submitAssessment(answers: any): Observable<any> {
    this.spinner.show(); // Show spinner before submitting

    return new Observable((observer) => {
      this.http.post(`${this.apiUrl}/submit-assessment/`, answers)
        .subscribe({
          next: (response) => {
            this.spinner.hide(); // Hide spinner on successful submission
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            this.spinner.hide(); // Hide spinner on error
            observer.error(error);
          }
        });
    });
  }
}
