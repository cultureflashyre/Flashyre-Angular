// src/app/services/skill.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment'; // Adjust path to your environment file


// Interface for the skill object returned by your API
export interface ApiSkill {
  id: number;
  name: string;
  category?: { // Category might be null or not always present in simple lists
    id: number;
    name: string;
  };
  description?: string;
  is_active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SkillService {
  // Adjust this URL to your actual Django API endpoint
  private skillsServiceEndpoint = environment.apiUrl + 'api/v1/skills/'; // e.g., 'http://localhost:8000/api/v1/skills/'

  constructor(private http: HttpClient) { }

  /**
   * Searches for skills based on a search term.
   * Fetches from the backend API which performs a 'startsWith' search.
   * @param term The search term (prefix)
   * @returns Observable<ApiSkill[]> An observable array of skill objects matching the term.
   */
  searchSkills(term: string): Observable<ApiSkill[]> {
    if (!term.trim()) {
      // If no search term, return empty array.
      return of([]);
    }
    // The backend search_fields = ['^name'] handles the startsWith logic
    const params = new HttpParams().set('search', term);

    return this.http.get<ApiSkill[]>(this.skillsServiceEndpoint, { params }).pipe(
      map(response => response), // DRF typically returns the results directly in an array if not paginated
      catchError(this.handleError<ApiSkill[]>('searchSkills', []))
    );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`, error);
      // Optionally, send the error to remote logging infrastructure
      // Let the app keep running by returning an empty/default result.
      return of(result as T);
    };
  }
}