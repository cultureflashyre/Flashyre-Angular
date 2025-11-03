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


  // Helper to get auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getJWTToken();
    if (!token) {
      this.router.navigate(['/login-candidate']);
      throw new Error('No authentication token found.');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

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
  try {
    const headers = this.getAuthHeaders();
    const url = `${this.baseUrl}assessment/get-assessment-score/${assessmentId}/`;
    return this.http.get(url, { headers });
  } catch (error) {
    // If getAuthHeaders fails (e.g., no token), return an observable that emits an error
    return new Observable(observer => observer.error('Authentication failed'));
  }
}

 // --- NEW METHODS FOR AI RECOMMENDATION ---

  /**
   * Gets the current status of an AI recommendation analysis.
   * @param resultId The ID of the assessment result.
   */
  getRecommendationStatus(resultId: number): Observable<any> {
    try {
      const headers = this.getAuthHeaders();
      const url = `${this.baseUrl}assessment/recommendation/${resultId}/status/`;
      return this.http.get(url, { headers });
    } catch (error) {
      return of({ status: 'FAILED', error: 'Authentication failed' });
    }
  }

  /**
   * Triggers the generation of a new AI recommendation.
   * @param resultId The ID of the assessment result.
   */
  generateRecommendation(resultId: number): Observable<any> {
    try {
      const headers = this.getAuthHeaders();
      const url = `${this.baseUrl}assessment/recommendation/${resultId}/generate/`;
      // Sending an empty object {} in the body of a POST request
      return this.http.post(url, {}, { headers });
    } catch (error) {
      return of({ status: 'FAILED', error: 'Authentication failed' });
    }
  }

}