import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

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

  private apiUrl = 'https://your-server-url.com/api'; // Replace with your server URL
  private timerSource = new BehaviorSubject<number>(0);
  public timer$ = this.timerSource.asObservable();

  constructor(private http: HttpClient) { }

  // Fetch assessment data including sections, questions, and timer duration
  getAssessmentData(assessmentId: number): Observable<AssessmentResponse> {
    return this.http.get<AssessmentResponse>(`${this.apiUrl}/assessments/?assessment_id=${assessmentId}`);
  }

  // Update timer value
  updateTimer(time: number) {
    this.timerSource.next(time);
  }

  // Submit assessment answers
  submitAssessment(answers: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit-assessment`, answers);
  }
}
