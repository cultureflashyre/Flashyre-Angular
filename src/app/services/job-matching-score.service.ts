import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ScoreBreakdown {
    skills_similarity: number;
    experience_similarity: number;
    experience_years_score: number;
    location_score: number;
}

export interface JobMatchingScore {
    candidate_id: number;
    first_name: string;
    last_name: string;
    job_role: string;
    skills: string;
    total_experience: number;
    relevant_experience: number;
    city: string;
    state: string;
    overall_score: number;
    score_breakdown: ScoreBreakdown;
}

@Injectable({
    providedIn: 'root'
})
export class JobMatchingScoreService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getMatchingScores(jobId: number, page: number = 1): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}api/job-matching-score/?requirement_id=${jobId}&page=${page}`);
    }
}
