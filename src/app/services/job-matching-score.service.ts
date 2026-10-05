import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PipelineInfo {
    stage: string;
    job_role: string;
    client_name: string;
    recruiter_name: string;
    job_id: number | null;
    updated_at: string | null;
}

export interface ScoreBreakdown {
    skills_match: number;
    experience_meaning: number;
    years_of_experience: number;
    location_match: number;
    overall_fit: number;
}

export interface ScoredCandidate {
    candidate_id: number;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    phone_number: string;
    skills: string;
    work_experience: string;
    total_experience: number;
    relevant_experience: number;
    current_location: string;
    preferred_location: string;
    score: number;
    breakdown: ScoreBreakdown;
    score_source: 'resume_analyzed' | 'profile_data';
    matched_skills: string[];
    partial_skills: string[];
    missing_skills: string[];
    latest_rating_score: number | null;
    notice_period: string;
    current_ctc: string;
    expected_ctc_min: number | null;
    expected_ctc_max: number | null;
    resume: string | null;
    source: string;
    recruiter_name: string;
    lead_pipeline: PipelineInfo | null;
    active_applications: PipelineInfo[];
    placement_status: string | null;
    placement_job_title?: string | null;
    placement_client_name?: string | null;
    placed_by_name?: string | null;
}

export interface NeedsInfoCandidate {
    candidate_id: number;
    name: string;
    email: string;
    phone_number: string;
    available_fields: string[];
    missing_fields: string[];
    has_resume: boolean;
    lead_pipeline: PipelineInfo | null;
    active_applications: PipelineInfo[];
    placement_status: string | null;
    placement_job_title?: string | null;
    placement_client_name?: string | null;
    placed_by_name?: string | null;
}

export interface JobMatchingResponse {
    requirement_id: number;
    requirement_title: string;
    client_name: string;
    total_candidates: number;
    candidates: ScoredCandidate[];
    needs_info_candidates: NeedsInfoCandidate[];
    skipped_candidates: { id: number; name: string; email: string }[];
}

@Injectable({
    providedIn: 'root'
})
export class JobMatchingScoreService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getMatchingScores(jobId: number, page: number = 1, search: string = ''): Observable<JobMatchingResponse> {
        let url = `${this.apiUrl}api/job-matching-score/?requirement_id=${jobId}&page=${page}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }
        return this.http.get<JobMatchingResponse>(url);
    }
}
