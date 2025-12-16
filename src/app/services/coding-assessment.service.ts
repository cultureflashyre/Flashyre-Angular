
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CodingAssessmentService {
  private apiUrl = 'http://localhost:8000/api/coding/'; // Your Django API
  private codeforcesUrl = 'https://codeforces.com/api/problemset.problems';

  constructor(private http: HttpClient) {}

  getProblems(): Observable<any> {
    return this.http.get(this.apiUrl + 'problems/').pipe(
      map((response: any) => response)
    );
  }

  getCodeforcesProblems(): Observable<any> {
    return this.http.get(this.codeforcesUrl).pipe(
      map((response: any) => ({
        problems: response.result.problems.map((p: any) => ({
          id: `${p.contestId}${p.index}`, // Unique ID
          title: `${p.name} (Codeforces ${p.contestId}${p.index})`,
          description: 'Problem statement available at Codeforces.',
          input_format: p.input || 'Standard input format',
          output_format: p.output || 'Standard output format',
          constraints: p.tags.join(', ') + `, Rating: ${p.rating || 'N/A'}`,
          example: 'Check Codeforces for samples.',
          timer: 30
        }))
      }))
    );
  }

  getProblem(id: number): Observable<any> {
    return this.http.get(this.apiUrl + `problems/${id}`).pipe(
      map((response: any) => response)
    );
  }

  runCode(data: { problem_id: number, source_code: string, language_id: number }): Observable<any> {
    // Add trailing slash to match the Django URL pattern 'run/'
    return this.http.post(this.apiUrl + 'run/', data);
  }

  submitCode(data: { problem_id: number, source_code: string, language_id: number }): Observable<any> {
    // Add trailing slash to match the Django URL pattern 'submissions/'
    return this.http.post(this.apiUrl + 'submissions/', data);
  }
}
