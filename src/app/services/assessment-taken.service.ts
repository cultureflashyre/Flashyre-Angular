import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './candidate.service'; // Import AuthService
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AssessmentTakenService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  getAllAssessmentScores(): Observable<any> {
    const token = this.authService.getJWTToken();
    if (!token) {
      console.error('No token found. User must log in.');
      this.router.navigate(['/login-candidate']); // Redirect to login
      return of(null); // Return an empty observable to prevent errors
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.baseUrl}assessment/get_all_assessment_scores/`);
  }

fetchAssessmentScore(assessmentId: string): Observable<any> {
  const url = `${this.baseUrl}assessment/get-assessment-score/${assessmentId}/`;
  return this.http.get(url);
}


}