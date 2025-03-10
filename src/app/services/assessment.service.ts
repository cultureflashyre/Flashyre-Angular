// assessment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {

  private apiUrl = 'https://your-server-url.com/api'; // Replace with your server URL
  private timerSource = new BehaviorSubject<number>(0);
  public timer$ = this.timerSource.asObservable();

  constructor(private http: HttpClient) { }

  // Fetch assessment sections and questions
  getAssessmentData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/assessment`);
  }

  // Fetch countdown timer duration
  getTimerDuration(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/timer-duration`);
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
